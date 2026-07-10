import type { OAuthTokens } from "@ai-sdk/mcp";
import { MCP_OAUTH_TOKEN_EXPIRY_BUFFER_MS } from "../constants/mcp-auth";

export function getMcpAccessTokenExpiresAt(tokens: OAuthTokens) {
  return tokens.expires_in !== undefined
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;
}

export function isMcpAccessTokenExpiring(expiresAt: Date | null) {
  return Boolean(
    expiresAt &&
      expiresAt.getTime() - MCP_OAUTH_TOKEN_EXPIRY_BUFFER_MS <= Date.now()
  );
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
