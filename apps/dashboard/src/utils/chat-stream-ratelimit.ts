import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { CHAT_STREAM_CONNECTION_RATE_LIMIT } from "@/constants/chat-stream";

const chatStreamConnectionRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  analytics: true,
  prefix: "ratelimit:chat-stream-connection",
  limiter: Ratelimit.slidingWindow(CHAT_STREAM_CONNECTION_RATE_LIMIT, "1m"),
});

export async function enforceChatStreamConnectionRatelimit(
  organizationId: string,
  userId: string
) {
  const result = await chatStreamConnectionRatelimit.limit(
    `${organizationId}:${userId}`
  );

  if (result.success) {
    return null;
  }

  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many chat stream connections" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
