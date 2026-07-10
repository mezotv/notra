import { getMcpServerIntegrationById } from "@notra/ai/integrations/mcp";
import {
  McpOauthError,
  startMcpOauthAuthorization,
} from "@notra/ai/integrations/mcp-oauth";
import { redis } from "@notra/ai/utils/redis";
import { ORPCError } from "@orpc/server";
import { type NextRequest, NextResponse } from "next/server";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { mcpOauthErrorParam } from "@/lib/integrations/mcp/oauth-errors";
import { mcpOauthAuthorizeQuerySchema } from "@/schemas/integrations";
import type { McpOauthState } from "@/types/integrations/mcp";
import { buildCallbackUrl } from "@/utils/build-callback-url";

const MCP_OAUTH_STATE_TTL_SECONDS = 600;

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const { searchParams } = new URL(request.url);
    const parsed = mcpOauthAuthorizeQuerySchema.safeParse({
      organizationId: searchParams.get("organizationId") ?? undefined,
      serverId: searchParams.get("serverId") ?? undefined,
      callbackPath: searchParams.get("callbackPath") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.redirect(`${baseUrl}/?error=invalid_request`);
    }

    const { organizationId, serverId, callbackPath } = parsed.data;

    let userId: string;
    try {
      const access = await assertOrganizationAccess({
        headers: request.headers,
        organizationId,
      });
      userId = access.user.id;
    } catch (error) {
      if (error instanceof ORPCError) {
        return NextResponse.redirect(
          `${baseUrl}/?error=${mcpOauthErrorParam(error.status)}`
        );
      }
      throw error;
    }

    if (!redis) {
      return NextResponse.redirect(
        buildCallbackUrl(baseUrl, callbackPath, {
          mcpOauthError: "mcp_oauth_not_configured",
        })
      );
    }

    const integration = await getMcpServerIntegrationById(serverId);
    if (!integration || integration.organizationId !== organizationId) {
      return NextResponse.redirect(
        buildCallbackUrl(baseUrl, callbackPath, {
          mcpOauthError: "server_not_found",
        })
      );
    }

    const state = crypto.randomUUID();
    const redirectUri = `${baseUrl}/api/integrations/mcp/oauth/callback`;

    let authorizationUrl: string;
    let context: McpOauthState["context"];
    try {
      const authorization = await startMcpOauthAuthorization({
        serverUrl: integration.url,
        redirectUrl: redirectUri,
        state,
      });
      authorizationUrl = authorization.authorizationUrl;
      context = authorization.context;
    } catch (error) {
      console.error("Error preparing MCP OAuth authorization:", error);
      return NextResponse.redirect(
        buildCallbackUrl(baseUrl, callbackPath, {
          mcpOauthError:
            error instanceof McpOauthError ? "unsupported" : "discovery_failed",
        })
      );
    }

    const oauthState: McpOauthState = {
      organizationId,
      userId,
      serverId,
      callbackPath,
      context,
    };

    await redis.set(`mcp_oauth:${state}`, JSON.stringify(oauthState), {
      ex: MCP_OAUTH_STATE_TTL_SECONDS,
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Error initiating MCP OAuth:", error);
    return NextResponse.redirect(`${baseUrl}/?error=mcp_auth_failed`);
  }
}
