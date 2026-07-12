import {
  discoverAuthorizationServerMetadata,
  discoverOAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/client/auth.js";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import type {
  McpOAuthServerConfiguration,
  McpOAuthStoredAuthorizationServer,
} from "../types/mcp-oauth";
import { publicMcpOAuthFetch } from "../utils/mcp-oauth-fetch";
import { getValidatedMcpOAuthResource } from "../utils/mcp-oauth-url";
import { McpOAuthAuthorizationError } from "./mcp-oauth-errors";

export async function discoverMcpOAuthServerConfiguration(
  serverUrl: string
): Promise<McpOAuthServerConfiguration> {
  const resourceMetadata = await discoverMcpOAuthProtectedResource(serverUrl);
  const authorizationServerUrl = new URL(
    resourceMetadata?.authorization_servers?.[0] ?? new URL(serverUrl).origin
  );
  await assertPublicHttpUrlResolution(authorizationServerUrl.toString());
  const authorizationServerMetadata = await discoverAuthorizationServerMetadata(
    authorizationServerUrl,
    {
      fetchFn: publicMcpOAuthFetch,
    }
  );
  if (!authorizationServerMetadata) {
    throw new McpOAuthAuthorizationError(
      "This MCP server does not support OAuth discovery."
    );
  }
  const resource = getValidatedMcpOAuthResource(serverUrl, resourceMetadata);
  return {
    authorizationServerMetadata,
    authorizationServerUrl,
    resource,
    resourceMetadata,
  };
}

async function discoverMcpOAuthProtectedResource(serverUrl: string) {
  return discoverOAuthProtectedResourceMetadata(
    serverUrl,
    undefined,
    publicMcpOAuthFetch
  ).catch(() => undefined);
}

export async function restoreMcpOAuthServerConfiguration(
  serverUrl: string,
  storedAuthorizationServer: McpOAuthStoredAuthorizationServer
): Promise<McpOAuthServerConfiguration> {
  if (!("issuer" in storedAuthorizationServer)) {
    return discoverMcpOAuthServerConfiguration(serverUrl);
  }
  const authorizationServerUrl = new URL(storedAuthorizationServer.issuer);
  await assertPublicHttpUrlResolution(authorizationServerUrl.toString());
  const resourceMetadata = await discoverMcpOAuthProtectedResource(serverUrl);
  return {
    authorizationServerMetadata: storedAuthorizationServer,
    authorizationServerUrl,
    resource: getValidatedMcpOAuthResource(serverUrl, resourceMetadata),
    resourceMetadata,
  };
}
