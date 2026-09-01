export const POSTHOG_DEFAULT_HOST = "https://us.i.posthog.com";

export const POSTHOG_DISTINCT_ID_HEADER = "x-posthog-distinct-id";

export const POSTHOG_SESSION_ID_HEADER = "x-posthog-session-id";

export const POSTHOG_GROUP_TYPES = {
  ORGANIZATION: "organization",
  PROJECT: "project",
} as const;

export const POSTHOG_SERVER_FLUSH_AT = 1;

export const POSTHOG_SERVER_FLUSH_INTERVAL_MS = 0;

export const POSTHOG_SERVER_REQUEST_TIMEOUT_MS = 5000;

export const POSTHOG_SERVICE_DISTINCT_ID_PREFIX = "service:";

export const POSTHOG_OTEL_SERVICE_NAME = "notra";
