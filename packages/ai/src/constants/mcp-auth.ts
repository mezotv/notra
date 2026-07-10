export const MCP_AUTH_TYPES = ["none", "headers", "oauth"] as const;

export const MCP_OAUTH_CREDENTIAL_STATUSES = [
  "connected",
  "refreshing",
  "reauth_required",
  "error",
] as const;

export const MCP_OAUTH_PENDING_TTL_MS = 10 * 60 * 1000;
export const MCP_OAUTH_TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;
export const MCP_OAUTH_REFRESH_WAIT_MS = 100;
export const MCP_OAUTH_REFRESH_WAIT_ATTEMPTS = 50;
export const MCP_OAUTH_REFRESH_LEASE_MS = 30_000;
export const MCP_OAUTH_CALLBACK_PATH = "/api/integrations/mcp/oauth/callback";

export const MCP_OAUTH_CLIENT_NAME = "Notra";
export const MCP_OAUTH_CLIENT_URI = "https://www.usenotra.com";
