export const AGENT_CREATE_SESSION_PATH = "/eve/v1/session";
export const AGENT_SESSION_TASK_MODE = "task";
export const AGENT_TRAILING_SLASH_PATTERN = /\/+$/;
export const AGENT_TASK_POLL_INTERVAL_MS = 5000;
export const AGENT_TASK_TIMEOUT_MS = 15 * 60 * 1000;
export const AGENT_PROXY_ALLOWED_PATHS = [
  /^eve\/v1\/session$/,
  /^eve\/v1\/session\/[^/]+$/,
  /^eve\/v1\/session\/[^/]+\/stream$/,
] as const;
