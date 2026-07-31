export const SLACK_OAUTH_STATE_TTL_SECONDS = 600;

export const SLACK_BOT_SCOPES = [
  "assistant:write",
  "app_mentions:read",
  "chat:write",
  "channels:history",
  "channels:read",
  "groups:history",
  "groups:read",
  "im:history",
  "files:read",
].join(",");

export const SLACK_CHANNEL_CACHE_TTL_SECONDS = 60 * 60;
