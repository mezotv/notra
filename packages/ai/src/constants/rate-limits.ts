export const CHAT_GENERATION_RATE_LIMIT = {
  requests: 30,
  window: "1m",
  windowLabel: "1 minute",
} as const;

export const CHAT_GENERATION_USER_RATE_LIMIT = {
  requests: 20,
  window: "1m",
} as const;
