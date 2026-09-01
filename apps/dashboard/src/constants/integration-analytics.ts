export const INTEGRATION_PROVIDERS = {
  GITHUB: "github",
  LINEAR: "linear",
  SLACK: "slack",
  GRANOLA: "granola",
  MCP: "mcp",
  MCP_STORE: "mcp_store",
  X: "x",
  LINKEDIN: "linkedin",
} as const;

export const INTEGRATION_AUTH_KINDS = {
  OAUTH: "oauth",
  API_KEY: "api_key",
  HEADERS: "headers",
  PUBLIC: "public",
} as const;

export const SLACK_CHANNEL_KINDS = {
  NOTIFICATIONS: "notifications",
  ACCESS: "access",
} as const;

export const ANALYTICS_VIEW_STATES = {
  OK: "ok",
  NO_ACCOUNTS: "no_accounts",
  NOT_CONFIGURED: "not_configured",
  FLAG_OFF: "flag_off",
} as const;

export const MCP_CONNECTION_TEST_OUTCOMES = {
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export const SOCIAL_PLATFORM_TO_INTEGRATION_PROVIDER = {
  twitter: INTEGRATION_PROVIDERS.X,
  linkedin: INTEGRATION_PROVIDERS.LINKEDIN,
} as const;

export const REFERENCE_QUOTA_FEATURE = "references";

export const BRAND_REFERENCE_SOURCES = {
  MANUAL: "manual",
  TWEET: "tweet",
  URL: "url",
} as const;
