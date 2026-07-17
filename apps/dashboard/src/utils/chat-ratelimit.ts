import { CHAT_GENERATION_RATE_LIMIT } from "@notra/ai/constants/rate-limits";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const chatGenerationRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  analytics: true,
  prefix: "ratelimit:chat-generation",
  limiter: Ratelimit.slidingWindow(
    CHAT_GENERATION_RATE_LIMIT.requests,
    CHAT_GENERATION_RATE_LIMIT.window
  ),
});

export async function enforceChatGenerationRatelimit(
  organizationId: string
): Promise<NextResponse | null> {
  const result = await chatGenerationRatelimit.limit(organizationId);
  const resetSeconds = Math.max(
    0,
    Math.ceil((result.reset - Date.now()) / 1000)
  );

  if (result.success) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      limit: result.limit,
      remaining: Math.max(0, result.remaining),
      reset: result.reset,
    },
    {
      status: 429,
      headers: {
        "RateLimit-Limit": String(result.limit),
        "RateLimit-Remaining": String(Math.max(0, result.remaining)),
        "RateLimit-Reset": String(resetSeconds),
        "Retry-After": String(resetSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
        "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
      },
    }
  );
}
