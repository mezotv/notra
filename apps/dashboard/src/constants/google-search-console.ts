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
