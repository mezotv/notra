export const OAUTH_AUTH_CODE_TTL_MS = 5 * 60 * 1000;
export const OAUTH_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const OAUTH_REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export const OAUTH_OFFLINE_ACCESS_SCOPE = "offline_access";

export const OAUTH_SUPPORTED_SCOPES = [
  "offline_access",
  "posts.read",
  "posts.write",
  "brand-identities.read",
  "brand-identities.write",
  "integrations.read",
  "integrations.write",
  "schedules.read",
  "schedules.write",
  "chats.read",
  "chats.write",
  "skills.read",
  "skills.write",
] as const;

export const OAUTH_LEGACY_SCOPES = ["api.read", "api.write"] as const;

export const OAUTH_ACCEPTED_SCOPES = [
  ...OAUTH_SUPPORTED_SCOPES,
  ...OAUTH_LEGACY_SCOPES,
] as const;

export const OAUTH_SUPPORTED_SCOPE_SET: ReadonlySet<string> = new Set(
  OAUTH_SUPPORTED_SCOPES
);

export const OAUTH_DEFAULT_SCOPES = [
  "posts.read",
  "brand-identities.read",
  "integrations.read",
  "schedules.read",
  "chats.read",
  "skills.read",
] as const;

export const OAUTH_CLIENT_REGISTRATION_DEFAULT_SCOPES = [
  "offline_access",
  "posts.read",
  "posts.write",
  "brand-identities.read",
  "brand-identities.write",
  "integrations.read",
  "integrations.write",
  "schedules.read",
  "schedules.write",
  "chats.read",
  "chats.write",
  "skills.read",
  "skills.write",
] as const;

export const OAUTH_GRANT_QUERY_PARAM = "grant";

export const OAUTH_SCOPE_LEVEL = {
  none: "none",
  read: "read",
  write: "write",
} as const;

export const OAUTH_SCOPE_RESOURCES = [
  {
    id: "posts",
    label: "Posts",
    description: "Read and manage your posts and drafts",
    readScope: "posts.read",
    writeScope: "posts.write",
  },
  {
    id: "brand-identities",
    label: "Brand identities",
    description: "Read and manage saved brand voices",
    readScope: "brand-identities.read",
    writeScope: "brand-identities.write",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Read and manage connected content sources",
    readScope: "integrations.read",
    writeScope: "integrations.write",
  },
  {
    id: "schedules",
    label: "Schedules",
    description: "Read and manage scheduled content generation",
    readScope: "schedules.read",
    writeScope: "schedules.write",
  },
  {
    id: "chats",
    label: "Chats",
    description: "Read and manage chat sessions",
    readScope: "chats.read",
    writeScope: "chats.write",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Read and manage your skills",
    readScope: "skills.read",
    writeScope: "skills.write",
  },
] as const;

export const OAUTH_SUPPORTED_RESOURCES = [
  "https://api.usenotra.com",
  "https://mcp.usenotra.com",
  "https://mcp.usenotra.com/mcp",
] as const;

export const OAUTH_SUPPORTED_RESOURCE_SET: ReadonlySet<string> = new Set(
  OAUTH_SUPPORTED_RESOURCES
);

export const OAUTH_AUTHORIZATION_CODE_GRANT = "authorization_code";
export const OAUTH_REFRESH_TOKEN_GRANT = "refresh_token";

export const OAUTH_METADATA_CACHE_CONTROL = "public, max-age=3600";
export const OAUTH_METADATA_ERROR_CACHE_CONTROL = "no-store";

export const OAUTH_PUBLIC_AUTHORIZATION_ENDPOINT = "/agent/auth/authorize";
export const OAUTH_PUBLIC_TOKEN_ENDPOINT = "/agent/auth/token";
export const OAUTH_PUBLIC_REGISTRATION_ENDPOINT = "/agent/auth/register";
export const OAUTH_PUBLIC_REVOCATION_ENDPOINT = "/agent/auth/revoke";
