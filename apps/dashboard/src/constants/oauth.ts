export const OAUTH_AUTH_CODE_TTL_MS = 5 * 60 * 1000;
export const OAUTH_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const OAUTH_REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export const OAUTH_SUPPORTED_SCOPES = [
  "api.read",
  "api.write",
  "offline_access",
  "posts.read",
  "posts.write",
  "skills.read",
  "skills.write",
] as const;

export const OAUTH_SUPPORTED_SCOPE_SET: ReadonlySet<string> = new Set(
  OAUTH_SUPPORTED_SCOPES
);

export const OAUTH_DEFAULT_SCOPES = ["api.read"] as const;

export const OAUTH_SUPPORTED_RESOURCES = [
  "https://api.usenotra.com",
  "https://mcp.usenotra.com",
] as const;

export const OAUTH_SUPPORTED_RESOURCE_SET: ReadonlySet<string> = new Set(
  OAUTH_SUPPORTED_RESOURCES
);

export const OAUTH_AUTHORIZATION_CODE_GRANT = "authorization_code";
export const OAUTH_REFRESH_TOKEN_GRANT = "refresh_token";
