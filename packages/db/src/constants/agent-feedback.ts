export const AGENT_FEEDBACK_KINDS = [
  "bug",
  "feature",
  "praise",
  "question",
  "other",
] as const;

export const AGENT_FEEDBACK_SENTIMENTS = [
  "negative",
  "neutral",
  "positive",
] as const;

export const AGENT_FEEDBACK_STATUSES = [
  "new",
  "triaged",
  "resolved",
  "archived",
] as const;

export const AGENT_FEEDBACK_SOURCES = ["mcp", "api", "sdk"] as const;

export const AGENT_FEEDBACK_MESSAGE_MAX_LENGTH = 4000;
export const AGENT_FEEDBACK_TITLE_MAX_LENGTH = 200;
export const AGENT_FEEDBACK_SHORT_FIELD_MAX_LENGTH = 200;
export const AGENT_FEEDBACK_URL_MAX_LENGTH = 2048;
export const AGENT_FEEDBACK_METADATA_MAX_BYTES = 8192;
export const AGENT_FEEDBACK_IDEMPOTENCY_KEY_MAX_LENGTH = 200;

export const AGENT_FEEDBACK_RATE_LIMIT_PER_IP = 30;
export const AGENT_FEEDBACK_RATE_LIMIT_IP_WINDOW_MINUTES = 10;
export const AGENT_FEEDBACK_RATE_LIMIT_IP_WINDOW_LABEL = "10 minutes";
export const AGENT_FEEDBACK_RATE_LIMIT_PER_ORGANIZATION = 200;
export const AGENT_FEEDBACK_RATE_LIMIT_ORGANIZATION_WINDOW_MINUTES = 60;
export const AGENT_FEEDBACK_RATE_LIMIT_ORGANIZATION_WINDOW_LABEL = "hour";

export const AGENT_FEEDBACK_TOKEN_PREFIX = "nfb_";
export const AGENT_FEEDBACK_TOKEN_SECRET_ENV = "FEEDBACK_INGEST_SECRET";
export const AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_PREFIX =
  "feedback:ingest-gen:v1";
export const AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_TTL_SECONDS = 5 * 60;
export const AGENT_FEEDBACK_TOKEN_MISSING_CACHE_TTL_SECONDS = 60;
