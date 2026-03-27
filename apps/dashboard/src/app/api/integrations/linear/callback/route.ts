import { type NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import {
  createLinearIntegration,
  getLinearIntegrationsByOrganization,
} from "@/lib/services/linear-integration";
import type {
  LinearOAuthState,
  LinearOrganizationResponse,
  LinearTokenResponse,
} from "@/types/linear-oauth";
import { buildCallbackUrl } from "@/utils/build-callback-url";

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

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

    const raw = await redis.get<string>(`linear_oauth:${state}`);
    if (!raw) {
      return NextResponse.redirect(`${baseUrl}/?error=expired_state`);
    }

    await redis.del(`linear_oauth:${state}`);

    const oauthState: LinearOAuthState =
      typeof raw === "string" ? JSON.parse(raw) : raw;

    const clientId = process.env.LINEAR_CLIENT_ID;
    const clientSecret = process.env.LINEAR_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
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

    return NextResponse.redirect(
      buildCallbackUrl(baseUrl, oauthState.callbackPath, {
        linearConnected: "true",
      })
    );
  } catch (error) {
    console.error("Error in Linear OAuth callback:", error);
    return NextResponse.redirect(`${baseUrl}/?error=callback_failed`);
  }
}
