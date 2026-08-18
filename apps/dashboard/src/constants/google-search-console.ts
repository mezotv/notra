export const GSC_OAUTH_STATE_TTL_SECONDS = 600;
export const GSC_OAUTH_STATE_KEY_PREFIX = "gsc_oauth:";
export const GSC_OAUTH_CALLBACK_PATH =
  "/api/integrations/google-search-console/callback";
export const GSC_OAUTH_AUTHORIZE_PATH =
  "/api/integrations/google-search-console/authorize";
export const GSC_SYNC_WORKFLOW_PATH = "/api/workflows/gsc-sync";
/** Mondays 06:00 UTC */
export const GSC_SYNC_CRON = "0 6 * * 1";
export const GSC_SYNC_LOOKBACK_DAYS = 28;
export const GSC_SYNC_ROW_LIMIT = 250;
export const GSC_SYNC_MIN_IMPRESSIONS = 1;
export const GSC_SYNC_MAX_KEYWORDS_FOR_MODEL = 80;
export const GSC_SUGGESTIONS_MAX_PER_SYNC = 15;
export const GSC_SUGGESTION_MODEL = "anthropic/claude-sonnet-4.6";
export const GSC_SUGGESTION_MAX_TOKENS = 3000;
export const GSC_SUGGESTION_SYSTEM_PROMPT =
  "You are a search visibility analyst. You turn the Google Search queries a website already ranks for into the natural-language questions people ask AI assistants about the same topics. Respond only with the requested structured data.";

export const GSC_ANALYZE_MUTATION_KEY = "gsc-analyze" as const;

export function gscAnalyzeMutationKey(organizationId: string) {
  return [GSC_ANALYZE_MUTATION_KEY, organizationId] as const;
}

export const GSC_SUGGESTIONS_CHECKING_TITLE =
  "Checking for prompt suggestions…";
export const GSC_SUGGESTIONS_CHECKING_DESCRIPTION =
  "Looking through queries your site already ranks for.";
export const GSC_SUGGESTIONS_HEADER_TITLE = "Suggested from Google Search";
export const GSC_SUGGESTIONS_HEADER_DESCRIPTION =
  "You already rank for these searches. Track how AI assistants answer the same questions.";
export const GSC_CARD_TITLE = "Google Search Console";
export const GSC_CARD_DESCRIPTION =
  "We read the queries your site ranks for and suggest the AI prompts people ask about the same topics. Suggestions refresh every week.";

export const GSC_POSITION_DECIMALS = 1;
export const GSC_MAX_VISIBLE_KEYWORDS = 4;
export const GSC_MIN_BRAND_TERM_LENGTH = 3;

export const GSC_OAUTH_ERROR_BY_STATUS = new Map<number, string>([
  [401, "gsc_session_expired"],
  [403, "gsc_forbidden"],
]);

export const GSC_ERROR_MESSAGES: Record<string, string> = {
  gsc_not_configured:
    "Google Search Console is not available on this workspace yet.",
  gsc_access_denied: "Google access was denied. Nothing was connected.",
  gsc_missing_refresh_token:
    "Google did not grant offline access. Please try connecting again.",
  gsc_token_exchange_failed: "Google sign-in failed. Please try again.",
  gsc_auth_failed: "Failed to connect Google Search Console.",
  gsc_expired_state: "The connection request expired. Please try again.",
  gsc_session_mismatch: "Please sign in again before connecting.",
  gsc_rate_limited: "Too many connection attempts. Please wait a moment.",
  gsc_session_expired: "Your session expired. Sign in and try again.",
  gsc_forbidden: "You do not have access to this organization.",
  gsc_invalid_callback:
    "Google returned an invalid response. Please try again.",
};
