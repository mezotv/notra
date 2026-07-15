import { redis } from "@notra/ai/utils/redis";
import { tooManyRequests } from "./errors";

export const MCP_CONNECTION_RATE_LIMIT = {
  limit: 10,
  windowSeconds: 60,
} as const;

const memoryCounters = new Map<string, { count: number; resetAt: number }>();

async function incrementCounter(key: string, windowSeconds: number) {
  if (redis) {
    const redisKey = `console:rate-limit:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
    }
    return count;
  }

  const now = Date.now();
  const entry = memoryCounters.get(key);
  if (!entry || entry.resetAt <= now) {
    memoryCounters.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return 1;
  }

  entry.count += 1;
  return entry.count;
}

export async function assertRateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}) {
  const count = await incrementCounter(params.key, params.windowSeconds);
  if (count > params.limit) {
    throw tooManyRequests(
      "Too many connection attempts. Wait a minute and try again."
    );
  }
}
