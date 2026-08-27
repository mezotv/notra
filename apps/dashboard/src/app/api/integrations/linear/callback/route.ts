import { invalidateStandaloneChatIntegrations } from "@notra/ai/chat/integrations-cache";
import {
  createLinearIntegration,
  getLinearIntegrationsByOrganization,
} from "@notra/ai/integrations/linear";
import { redis } from "@notra/ai/utils/redis";
import { buildCallbackUrl } from "@notra/utils/callback-url";
import { ORPCError } from "@orpc/server";
import { type NextRequest, NextResponse } from "next/server";

import { LINEAR_OAUTH_STATE_TTL_SECONDS } from "@/constants/linear";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { getServerSession } from "@/lib/auth/session";
import { linearOAuthErrorParam } from "@/lib/integrations/linear/oauth-errors";
import type {
  LinearOAuthState,
  LinearOrganizationResponse,
  LinearTokenResponse,
} from "@/types/linear-oauth";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  let restoreOAuthState: (() => Promise<void>) | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state || !redis) {
      return NextResponse.redirect(`${baseUrl}/?error=invalid_callback`);
    }

    const stateKey = `linear_oauth:${state}`;
    const remainingTtlSeconds = await redis.ttl(stateKey);
    const raw = await redis.getdel<string>(stateKey);
    if (!raw) {
      return NextResponse.redirect(`${baseUrl}/?error=expired_state`);
    }

    const restoreTtlSeconds = Math.min(
      remainingTtlSeconds,
      LINEAR_OAUTH_STATE_TTL_SECONDS
    );

    const activeRedis = redis;
    restoreOAuthState = async () => {
      if (restoreTtlSeconds <= 0) {
        return;
      }
      try {
        await activeRedis.set(
          stateKey,
          typeof raw === "string" ? raw : JSON.stringify(raw),
          { ex: restoreTtlSeconds }
        );
      } catch (restoreError) {
        console.error(
          "Failed to restore Linear OAuth state for retry:",
          restoreError
        );
      }
    };

    const oauthState: LinearOAuthState =
      typeof raw === "string" ? JSON.parse(raw) : raw;

    const { session } = await getServerSession({ headers: request.headers });
    if (!session?.userId || session.userId !== oauthState.userId) {
      await restoreOAuthState();
      return NextResponse.redirect(`${baseUrl}/?error=session_mismatch`);
    }

    try {
      await assertOrganizationAccess({
        headers: request.headers,
        organizationId: oauthState.organizationId,
      });
    } catch (error) {
      if (error instanceof ORPCError) {
        await restoreOAuthState();
        return NextResponse.redirect(
          `${baseUrl}/?error=${linearOAuthErrorParam(error.status, "forbidden")}`
        );
      }
      throw error;
    }

    const clientId = process.env.LINEAR_CLIENT_ID;
    const clientSecret = process.env.LINEAR_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      await restoreOAuthState();
      return NextResponse.redirect(`${baseUrl}/?error=linear_not_configured`);
    }

    const redirectUri = `${baseUrl}/api/integrations/linear/callback`;

    const tokenRes = await fetch("https://api.linear.app/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const tokenError = await tokenRes.text();
      console.error("Linear token exchange failed:", tokenError);
      await restoreOAuthState();
      return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
    }

    const tokens: LinearTokenResponse = await tokenRes.json();

    const orgRes = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({
        query: `{
          organization {
            id
            name
          }
        }`,
      }),
    });

    if (!orgRes.ok) {
      console.error("Linear organization fetch failed:", await orgRes.text());
      await restoreOAuthState();
      return NextResponse.redirect(`${baseUrl}/?error=org_fetch_failed`);
    }

    const orgData = (await orgRes.json()) as {
      data: { organization: LinearOrganizationResponse };
    };
    const linearOrg = orgData.data.organization;

    const existingIntegrations = await getLinearIntegrationsByOrganization(
      oauthState.organizationId
    );
    const alreadyConnected = existingIntegrations.some(
      (i) => i.linearOrganizationId === linearOrg.id
    );

    if (alreadyConnected) {
      return NextResponse.redirect(
        buildCallbackUrl(baseUrl, oauthState.callbackPath, {
          error: "workspace_already_connected",
        })
      );
    }

    await createLinearIntegration({
      organizationId: oauthState.organizationId,
      userId: oauthState.userId,
      displayName: linearOrg.name,
      accessToken: tokens.access_token,
      linearOrganizationId: linearOrg.id,
      linearOrganizationName: linearOrg.name,
    });

    await invalidateStandaloneChatIntegrations(oauthState.organizationId);

    return NextResponse.redirect(
      buildCallbackUrl(baseUrl, oauthState.callbackPath, {
        linearConnected: "true",
      })
    );
  } catch (error) {
    console.error("Error in Linear OAuth callback:", error);
    await restoreOAuthState?.();
    return NextResponse.redirect(`${baseUrl}/?error=callback_failed`);
  }
}
