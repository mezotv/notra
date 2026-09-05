export const GSC_OAUTH_AUTHORIZE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GSC_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GSC_OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
export const GSC_USERINFO_URL =
  "https://openidconnect.googleapis.com/v1/userinfo";
export const GSC_SITES_URL = "https://www.googleapis.com/webmasters/v3/sites";
export const GSC_SEARCH_ANALYTICS_BASE_URL =
  "https://searchconsole.googleapis.com/webmasters/v3/sites";
export const GSC_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "openid",
  "email",
] as const;

export const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;
export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 3600;
export const MS_PER_DAY = 86_400_000;
export const GSC_DATA_LAG_DAYS = 3;
export const GSC_MAX_ROW_LIMIT = 25_000;
export const GSC_INTEGRATION_LOCK_KEY_PREFIX = "gsc:integration-lock:";
export const GSC_INTEGRATION_LOCK_RETRY_DELAY_MS = 100;
export const GSC_INTEGRATION_LOCK_REDIS_TIMEOUT_MS = 5_000;
export const GSC_INTEGRATION_LOCK_TTL_SECONDS = 30;
export const GSC_INTEGRATION_LOCK_WAIT_MS = 20_000;
export const GSC_TOKEN_REVOKE_TIMEOUT_MS = 10_000;
export const REAUTH_ERROR_CODES = new Set([
  "invalid_grant",
  "invalid_client",
  "unauthorized_client",
]);
