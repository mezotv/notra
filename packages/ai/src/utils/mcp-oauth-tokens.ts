import type { OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import { MCP_OAUTH_TOKEN_EXPIRY_BUFFER_MS } from "../constants/mcp-auth";

export function getMcpAccessTokenExpiresAt(tokens: OAuthTokens) {
  return tokens.expires_in !== undefined
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;
}

export function getMcpAccessTokenRefreshAt(tokens: OAuthTokens) {
  if (tokens.expires_in === undefined) {
    return null;
  }
  const lifetimeMs = tokens.expires_in * 1000;
  const bufferMs = Math.min(
    MCP_OAUTH_TOKEN_EXPIRY_BUFFER_MS,
    Math.max(1000, lifetimeMs * 0.1)
  );
  return new Date(Date.now() + Math.max(0, lifetimeMs - bufferMs));
}

export function isMcpAccessTokenExpiring(refreshAt: Date | null) {
  return Boolean(refreshAt && refreshAt.getTime() <= Date.now());
}

export function toMcpOAuthRequestAuth(
  tokens: OAuthTokens,
  tokenVersion: number
) {
  return {
    authType: "oauth" as const,
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    oauthTokenVersion: tokenVersion,
  };
}
