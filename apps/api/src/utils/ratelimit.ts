import { CHAT_GENERATION_RATE_LIMIT } from "@notra/ai/constants/rate-limits";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Context } from "hono";
import { getOrganizationId } from "./auth";

const redis = Redis.fromEnv();

export const RATE_LIMITS = {
  postGeneration: { requests: 10, window: "1 minute" },
  brandGeneration: { requests: 5, window: "1 minute" },
  chatGeneration: {
    requests: CHAT_GENERATION_RATE_LIMIT.requests,
    window: CHAT_GENERATION_RATE_LIMIT.windowLabel,
  },
  integrationCreate: { requests: 20, window: "1 minute" },
  postUpdate: { requests: 60, window: "1 minute" },
  feedbackIngest: { requests: 120, window: "1 minute" },
  feedbackIngestIp: { requests: 60, window: "1 minute" },
} as const;

export const ratelimit = {
  postGeneration: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:api:post-generation",
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.postGeneration.requests, "1m"),
  }),
  brandGeneration: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:api:brand-generation",
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.brandGeneration.requests,
      "1m"
    ),
  }),
  chatGeneration: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:chat-generation",
    limiter: Ratelimit.slidingWindow(
      CHAT_GENERATION_RATE_LIMIT.requests,
      CHAT_GENERATION_RATE_LIMIT.window
    ),
  }),
  integrationCreate: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:api:integration-create",
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.integrationCreate.requests,
      "1m"
    ),
  }),
  postUpdate: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:api:post-update",
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.postUpdate.requests, "1m"),
  }),
  feedbackIngest: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:api:feedback-ingest",
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.feedbackIngest.requests, "1m"),
  }),
  feedbackIngestIp: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:api:feedback-ingest-ip",
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.feedbackIngestIp.requests,
      "1m"
    ),
  }),
};

type RatelimitScope = "credential" | "organization" | "ip";

function getClientIp(c: Context): string {
  const forwardedFor = c.req.header("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || c.req.header("x-real-ip");
  return ip || "unknown";
}

function getRatelimitKey(c: Context, scope: RatelimitScope): string {
  if (scope === "ip") {
    return getClientIp(c);
  }

  const auth = c.get("auth");
  if (auth) {
    if (scope === "organization") {
      const organizationId = getOrganizationId(c);
      if (organizationId) {
        return organizationId;
      }
    }

    if (auth.keyId) {
      return auth.keyId;
    }
  }

  return getClientIp(c);
}

function setRatelimitHeaders(
  c: Context,
  result: { limit: number; remaining: number; reset: number }
) {
  const resetSeconds = Math.max(
    0,
    Math.ceil((result.reset - Date.now()) / 1000)
  );

  c.header("RateLimit-Limit", String(result.limit));
  c.header("RateLimit-Remaining", String(Math.max(0, result.remaining)));
  c.header("RateLimit-Reset", String(resetSeconds));
  c.header("X-RateLimit-Limit", String(result.limit));
  c.header("X-RateLimit-Remaining", String(Math.max(0, result.remaining)));
  c.header("X-RateLimit-Reset", String(Math.ceil(result.reset / 1000)));

  return resetSeconds;
}

export async function enforceRatelimit(
  c: Context,
  limiter: Ratelimit,
  scope: RatelimitScope = "credential"
) {
  const result = await limiter.limit(getRatelimitKey(c, scope));
  const resetSeconds = setRatelimitHeaders(c, result);

  if (result.success) {
    return null;
  }

  c.header("Retry-After", String(resetSeconds));

  return c.json(
    {
      error: "Rate limit exceeded",
      limit: result.limit,
      remaining: Math.max(0, result.remaining),
      reset: result.reset,
    },
    429
  );
}
