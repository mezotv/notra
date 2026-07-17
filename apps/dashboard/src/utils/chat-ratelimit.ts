import {
  CHAT_GENERATION_RATE_LIMIT,
  CHAT_GENERATION_USER_RATE_LIMIT,
} from "@notra/ai/constants/rate-limits";
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

const userChatGenerationRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  analytics: true,
  prefix: "ratelimit:dashboard-chat-generation-user",
  limiter: Ratelimit.slidingWindow(
    CHAT_GENERATION_USER_RATE_LIMIT.requests,
    CHAT_GENERATION_USER_RATE_LIMIT.window
  ),
});

function rateLimitedResponse(result: {
  limit: number;
  remaining: number;
  reset: number;
}) {
  const resetSeconds = Math.max(
    0,
    Math.ceil((result.reset - Date.now()) / 1000)
  );

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

export async function enforceChatGenerationRatelimit(
  organizationId: string,
  userId: string
): Promise<NextResponse | null> {
  const userResult = await userChatGenerationRatelimit.limit(
    `${organizationId}:${userId}`
  );
  if (!userResult.success) {
    return rateLimitedResponse(userResult);
  }

  const organizationResult =
    await chatGenerationRatelimit.limit(organizationId);
  if (!organizationResult.success) {
    return rateLimitedResponse(organizationResult);
  }

  return null;
}
