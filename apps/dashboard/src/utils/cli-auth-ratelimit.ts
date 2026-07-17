import type { Ratelimit as RatelimitType } from "@upstash/ratelimit";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import {
  CLI_SESSION_AUTHORIZE_RATE_LIMIT,
  CLI_SESSION_INITIALIZE_RATE_LIMIT,
  CLI_SESSION_POLL_SECRET_RATE_LIMIT,
  CLI_SESSION_POLL_SESSION_RATE_LIMIT,
} from "@/lib/cli-auth/constants";

const redis = Redis.fromEnv();

export const cliSessionInitializeRatelimit = new Ratelimit({
  redis,
  analytics: true,
  prefix: "ratelimit:cli-session-initialize",
  limiter: Ratelimit.slidingWindow(CLI_SESSION_INITIALIZE_RATE_LIMIT, "1m"),
});

export const cliSessionPollSessionRatelimit = new Ratelimit({
  redis,
  analytics: true,
  prefix: "ratelimit:cli-session-poll-session",
  limiter: Ratelimit.slidingWindow(CLI_SESSION_POLL_SESSION_RATE_LIMIT, "1m"),
});

export const cliSessionPollSecretRatelimit = new Ratelimit({
  redis,
  analytics: true,
  prefix: "ratelimit:cli-session-poll-secret",
  limiter: Ratelimit.slidingWindow(CLI_SESSION_POLL_SECRET_RATE_LIMIT, "1m"),
});

export const cliSessionAuthorizeRatelimit = new Ratelimit({
  redis,
  analytics: true,
  prefix: "ratelimit:cli-session-authorize",
  limiter: Ratelimit.slidingWindow(CLI_SESSION_AUTHORIZE_RATE_LIMIT, "1m"),
});

export async function enforceCliSessionRatelimit(
  limiter: RatelimitType,
  identifier: string
) {
  const result = await limiter.limit(identifier);
  if (result.success) {
    return null;
  }

  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
