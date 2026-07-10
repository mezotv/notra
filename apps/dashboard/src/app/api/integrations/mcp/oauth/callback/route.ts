import { completeMcpOauthAuthorization } from "@notra/ai/integrations/mcp-oauth";
import { refreshMcpToolIndexForIntegration } from "@notra/ai/integrations/mcp-tool-index";
import { redis } from "@notra/ai/utils/redis";
import { ORPCError } from "@orpc/server";
import { type NextRequest, NextResponse } from "next/server";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { getServerSession } from "@/lib/auth/session";
import { mcpOauthErrorParam } from "@/lib/integrations/mcp/oauth-errors";
import type { McpOauthState } from "@/types/integrations/mcp";
import { buildCallbackUrl } from "@/utils/build-callback-url";

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (!(state && redis)) {
      return NextResponse.redirect(`${baseUrl}/?error=invalid_callback`);
    }

    const raw = await redis.get<string>(`mcp_oauth:${state}`);
    if (!raw) {
      return NextResponse.redirect(`${baseUrl}/?error=expired_state`);
    }

    const oauthState: McpOauthState =
      typeof raw === "string" ? JSON.parse(raw) : raw;

    if (error) {
      await redis.del(`mcp_oauth:${state}`);
      return NextResponse.redirect(
        buildCallbackUrl(baseUrl, oauthState.callbackPath, {
          mcpOauthError: error,
        })
      );
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/?error=invalid_callback`);
    }

    const { session } = await getServerSession({ headers: request.headers });
    if (!session?.userId || session.userId !== oauthState.userId) {
      return NextResponse.redirect(`${baseUrl}/?error=session_mismatch`);
    }

    try {
      await assertOrganizationAccess({
        headers: request.headers,
        organizationId: oauthState.organizationId,
      });
    } catch (accessError) {
      if (accessError instanceof ORPCError) {
        return NextResponse.redirect(
          `${baseUrl}/?error=${mcpOauthErrorParam(accessError.status, "forbidden")}`
        );
      }
      throw accessError;
    }

    await redis.del(`mcp_oauth:${state}`);

    const redirectUri = `${baseUrl}/api/integrations/mcp/oauth/callback`;

    try {
      await completeMcpOauthAuthorization({
        integrationId: oauthState.serverId,
        organizationId: oauthState.organizationId,
        authorizationCode: code,
        redirectUri,
        context: oauthState.context,
      });
    } catch (exchangeError) {
      console.error("MCP OAuth token exchange failed:", exchangeError);
      return NextResponse.redirect(
        buildCallbackUrl(baseUrl, oauthState.callbackPath, {
          mcpOauthError: "token_exchange_failed",
        })
      );
    }

    await refreshMcpToolIndexForIntegration({
      organizationId: oauthState.organizationId,
      integrationId: oauthState.serverId,
    }).catch(() => undefined);

    return NextResponse.redirect(
      buildCallbackUrl(baseUrl, oauthState.callbackPath, {
        mcpOauthConnected: "true",
      })
    );
  } catch (error) {
    console.error("Error in MCP OAuth callback:", error);
    return NextResponse.redirect(`${baseUrl}/?error=callback_failed`);
  }
}
