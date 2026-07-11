import type { OAuthProtectedResourceMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  checkResourceAllowed,
  resourceUrlFromServerUrl,
} from "@modelcontextprotocol/sdk/shared/auth-utils.js";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import { McpOAuthAuthorizationError } from "../integrations/mcp-oauth-errors";

export function getValidatedMcpOAuthResource(
  serverUrl: string,
  resourceMetadata: OAuthProtectedResourceMetadata | undefined
) {
  if (!resourceMetadata) {
    return undefined;
  }
  const requestedResource = resourceUrlFromServerUrl(serverUrl);
  if (
    !checkResourceAllowed({
      requestedResource,
      configuredResource: resourceMetadata.resource,
    })
  ) {
    throw new McpOAuthAuthorizationError(
      "The OAuth resource does not match the MCP server."
    );
  }
  return new URL(resourceMetadata.resource);
}

export async function assertValidMcpOAuthAuthorizationUrl(url: URL) {
  if (url.protocol !== "https:") {
    throw new McpOAuthAuthorizationError(
      "The OAuth authorization endpoint must use HTTPS."
    );
  }
  await assertPublicHttpUrlResolution(url.toString());
}
