export const MCP_AUTH_TYPES = ["none", "headers", "oauth"] as const;

export const MCP_OAUTH_PENDING_TTL_MS = 10 * 60 * 1000;
export const MCP_OAUTH_TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;
export const MCP_OAUTH_FETCH_TIMEOUT_MS = 15_000;
export const MCP_OAUTH_REFRESH_WAIT_MS = 250;
export const MCP_OAUTH_REFRESH_WAIT_TIMEOUT_MS = 60_000;
export const MCP_OAUTH_REFRESH_LEASE_MS = 30_000;
export const MCP_OAUTH_REFRESH_HEARTBEAT_MS = 10_000;
export const MCP_OAUTH_REFRESH_RETRY_DELAY_MS = 5000;
export const MCP_OAUTH_CALLBACK_PATH = "/api/integrations/mcp/oauth/callback";

export const MCP_OAUTH_CLIENT_NAME = "Notra";
export const MCP_OAUTH_CLIENT_URI = "https://www.usenotra.com";

export const TERMINAL_OAUTH_ERROR_CODES = new Set([
  "invalid_grant",
  "invalid_client",
  "unauthorized_client",
]);
