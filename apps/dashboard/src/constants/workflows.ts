import type { LookbackWindow } from "@/schemas/integrations";

export const DEFAULT_LOOKBACK_WINDOW: LookbackWindow = "last_7_days";
export const GITHUB_RATE_LIMIT_RETRY_DELAY = "30m";
export const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const EVENT_MAX_LISTED_COMMITS = 10;
export const UTC_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
