import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Data, Effect } from "effect";
import type { NextRequest } from "next/server";

type LimiterKind = "lookup" | "render";

const LIMITS: Record<LimiterKind, { requests: number; window: "1 h" }> = {
  lookup: { requests: 20, window: "1 h" },
  render: { requests: 10, window: "1 h" },
};

class StarVideoRateLimitExceeded extends Data.TaggedError(
  "StarVideoRateLimitExceeded"
)<{ readonly reset: number }> {}

const limiters: Partial<Record<LimiterKind, Ratelimit | null>> = {};

function getLimiter(kind: LimiterKind): Ratelimit | null {
  if (limiters[kind] !== undefined) {
    return limiters[kind] ?? null;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!(url && token)) {
    limiters[kind] = null;
    return null;
  }

  limiters[kind] = new Ratelimit({
    redis: new Redis({ url, token }),
    analytics: true,
    prefix: `ratelimit:web:star-video-${kind}`,
    limiter: Ratelimit.slidingWindow(
      LIMITS[kind].requests,
      LIMITS[kind].window
    ),
  });
  return limiters[kind] ?? null;
}

function getClientIp(request: NextRequest): string {
  if (process.env.VERCEL) {
    return (
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    );
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

export const enforceStarVideoRateLimit = Effect.fn("enforceStarVideoRateLimit")(
  function* (request: NextRequest, kind: LimiterKind) {
    const limiter = getLimiter(kind);

    if (!limiter) {
      return;
    }

    const result = yield* Effect.tryPromise({
      try: () => limiter.limit(getRateLimitKey(request)),
      catch: () => null,
    }).pipe(Effect.orElseSucceed(() => ({ success: true, reset: 0 })));

    if (!result.success) {
      return yield* Effect.fail(
        new StarVideoRateLimitExceeded({ reset: result.reset })
      );
    }
  }
);
