export const DEFAULT_ENDPOINT = "https://api.usenotra.com";
export const FEEDBACK_PATH = "/v1/feedback";
export const SUBMIT_TIMEOUT_MS = 10_000;
export const DEFAULT_TOOL_NAME = "submit_feedback";
export const FEEDBACK_KINDS = [
  "bug",
  "feature",
  "praise",
  "question",
  "other",
] as const;
export const FEEDBACK_SENTIMENTS = ["negative", "neutral", "positive"] as const;
export const MESSAGE_MAX_LENGTH = 4000;
export const TITLE_MAX_LENGTH = 200;
