export const SLACK_API_BASE_URL = "https://slack.com/api";
export const SLACK_REQUEST_TIMEOUT_MS = 15_000;
export const SLACK_CHANNEL_NAME_MAX_LENGTH = 80;
export const SLACK_EXTERNAL_CHANNEL_PREFIX = "ext-";
export const SLACK_EXTERNAL_CHANNEL_SUFFIX = "-notra";
export const SLACK_INVALID_CHANNEL_CHARS_REGEX = /[^a-z0-9_-]+/g;
export const SLACK_HYPHEN_RUNS_REGEX = /-{2,}/g;
export const SLACK_EDGE_HYPHENS_REGEX = /^-+|-+$/g;
