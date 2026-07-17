import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  CLI_SESSION_INITIALIZE_RATE_LIMIT,
  CLI_SESSION_POLL_RATE_LIMIT,
} from "@/lib/cli-auth/constants";

const redis = Redis.fromEnv();

export const cliSessionInitializeRatelimit = new Ratelimit({
  redis,
  analytics: true,
  prefix: "ratelimit:cli-session-initialize",
  limiter: Ratelimit.slidingWindow(CLI_SESSION_INITIALIZE_RATE_LIMIT, "1m"),
});

export const cliSessionPollRatelimit = new Ratelimit({
  redis,
  analytics: true,
  prefix: "ratelimit:cli-session-poll",
  limiter: Ratelimit.slidingWindow(CLI_SESSION_POLL_RATE_LIMIT, "1m"),
});
