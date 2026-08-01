export const SLACK_POST_MESSAGE_METHOD = "chat.postMessage";
export const SLACK_UPDATE_MESSAGE_METHOD = "chat.update";

export const SLACK_RATE_LIMITED_STATUS = 429;
export const SLACK_SERVER_ERROR_MIN_STATUS = 500;
export const SLACK_RATE_LIMITED_ERROR_CODE = "rate_limited";
export const SLACK_NETWORK_ERROR_CODE = "network_error";
export const SLACK_INVALID_RESPONSE_ERROR_CODE = "invalid_response";
export const SLACK_UNKNOWN_ERROR_CODE = "unknown_error";

export const SLACK_TERMINAL_ERROR_CODES: ReadonlySet<string> = new Set([
  "not_in_channel",
  "channel_not_found",
  "is_archived",
  "token_revoked",
  "account_inactive",
  "invalid_auth",
  "not_authed",
  "missing_scope",
  "message_not_found",
  "cant_update_message",
  "invalid_blocks",
  "invalid_blocks_format",
  "msg_too_long",
]);

export const SLACK_RETRYABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  SLACK_RATE_LIMITED_ERROR_CODE,
  "ratelimited",
  "service_unavailable",
  "internal_error",
  "fatal_error",
  "request_timeout",
]);

export const SLACK_DELIVERY_MAX_ATTEMPTS = 5;
export const SLACK_DELIVERY_BASE_BACKOFF_SECONDS = 30;
export const SLACK_DELIVERY_BACKOFF_FACTOR = 4;
export const SLACK_DELIVERY_MAX_BACKOFF_SECONDS = 3600;
export const SLACK_DELIVERY_INLINE_RETRY_ATTEMPTS = 1;
export const SLACK_DELIVERY_INLINE_RETRY_BASE_SECONDS = 2;
export const SLACK_DELIVERY_BATCH_SIZE = 25;
export const SLACK_DELIVERY_ATTEMPT_TIMEOUT_SECONDS = 300;

export const IRIS_SHIP_ACTION_ID = "iris_ship_post";
export const IRIS_SKIP_ACTION_ID = "iris_skip_post";
export const IRIS_REVIEW_ACTION_ID = "iris_review_post";

export const IRIS_EXCERPT_MAX_LENGTH = 200;
export const IRIS_TITLE_MAX_LENGTH = 140;
export const IRIS_HEADLINE_MAX_LENGTH = 240;
export const IRIS_MAX_CARD_ARTIFACTS = 10;
