import type { McpOAuthServerConfiguration } from "../types/mcp-oauth";

export function getMcpOAuthRequestedScope({
  authorizationServerMetadata,
  resourceMetadata,
}: McpOAuthServerConfiguration) {
  const scopes = new Set(resourceMetadata?.scopes_supported ?? []);
  if (
    authorizationServerMetadata.scopes_supported?.includes("offline_access")
  ) {
    scopes.add("offline_access");
  }
  return scopes.size > 0 ? [...scopes].join(" ") : undefined;
}
