import type { LookbackWindow } from "@/schemas/integrations";

export const DEFAULT_LOOKBACK_WINDOW: LookbackWindow = "last_7_days";
export const GITHUB_RATE_LIMIT_RETRY_DELAY = "30m";
export const EVENT_MAX_LISTED_COMMITS = 10;
export const CONTENT_EMAIL_DIGEST_DELAY = "5m";
export const CONTENT_EMAIL_DIGEST_TTL_SECONDS = 15 * 60;
