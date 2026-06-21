import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Data, Effect } from "effect";
import type { NextRequest } from "next/server";

const OSS_APPLICATION_RATE_LIMIT = {
  requests: 2,
  window: "1h",
} as const;

class OssApplicationRateLimitExceeded extends Data.TaggedError(
  "OssApplicationRateLimitExceeded"
)<{
  readonly limit: number;
  readonly remaining: number;
  readonly reset: number;
}> {}

class OssApplicationRateLimitError extends Data.TaggedError(
  "OssApplicationRateLimitError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (limiter) {
    return limiter;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!(url && token)) {
    return null;
  }

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    analytics: true,
    prefix: "ratelimit:web:oss-program-application",
    limiter: Ratelimit.slidingWindow(
      OSS_APPLICATION_RATE_LIMIT.requests,
      OSS_APPLICATION_RATE_LIMIT.window
    ),
  });

  return limiter;
}

function getClientIp(request: NextRequest): string {
  const vercelForwardedFor = request.headers
    .get("x-vercel-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  if (vercelForwardedFor) {
    return vercelForwardedFor;
  }

  if (process.env.VERCEL) {
    return "unknown";
  }

  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function getRateLimitKey(request: NextRequest): string {
  return createHash("sha256").update(getClientIp(request)).digest("hex");
}

export function getRateLimitHeaders(
  result: {
    limit: number;
    remaining: number;
    reset: number;
  },
  includeRetryAfter = false
): Headers {
  const resetSeconds = Math.max(
    0,
    Math.ceil((result.reset - Date.now()) / 1000)
  );

  const headers = new Headers({
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "RateLimit-Reset": String(resetSeconds),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  });

  if (includeRetryAfter) {
    headers.set("Retry-After", String(resetSeconds));
  }

  return headers;
}

export const enforceOssApplicationRateLimit = Effect.fn(
  "enforceOssApplicationRateLimit"
)(function* (request: NextRequest) {
  const ratelimit = getLimiter();

  if (!ratelimit) {
    if (process.env.NODE_ENV === "production") {
      return yield* Effect.fail(
        new OssApplicationRateLimitError({
          message: "Rate limit service is not configured",
          cause: new Error(
            "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set"
          ),
        })
      );
    }

    return {
      limit: OSS_APPLICATION_RATE_LIMIT.requests,
      remaining: OSS_APPLICATION_RATE_LIMIT.requests,
      reset: Date.now() + 60 * 60 * 1000,
    };
  }

  const result = yield* Effect.tryPromise({
    try: () => ratelimit.limit(getRateLimitKey(request)),
    catch: (cause) =>
      new OssApplicationRateLimitError({
        message: "Failed to enforce OSS application rate limit",
        cause,
      }),
  });

  if (!result.success) {
    return yield* Effect.fail(
      new OssApplicationRateLimitExceeded({
        limit: result.limit,
        remaining: Math.max(0, result.remaining),
        reset: result.reset,
      })
    );
  }

  return {
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
});
