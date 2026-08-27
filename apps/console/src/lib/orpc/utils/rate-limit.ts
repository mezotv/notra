import { redis } from "@notra/ai/utils/redis";

import { tooManyRequests } from "./errors";

export const MCP_CONNECTION_RATE_LIMIT = {
  limit: 10,
  windowSeconds: 60,
} as const;

export const BRANDING_UPLOAD_RATE_LIMIT = {
  limit: 20,
  windowSeconds: 60,
} as const;

const INCREMENT_WITH_TTL_SCRIPT = `local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count`;

const memoryCounters = new Map<string, { count: number; resetAt: number }>();

function evictExpiredCounters(now: number) {
  for (const [key, entry] of memoryCounters) {
    if (entry.resetAt <= now) {
      memoryCounters.delete(key);
    }
  }
}

async function incrementCounter(key: string, windowSeconds: number) {
  if (redis) {
    return await redis.eval<[number], number>(
      INCREMENT_WITH_TTL_SCRIPT,
      [`console:rate-limit:${key}`],
      [windowSeconds]
    );
  }

  const now = Date.now();
  evictExpiredCounters(now);

  const entry = memoryCounters.get(key);
  if (!entry) {
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
  message?: string;
}) {
  const count = await incrementCounter(params.key, params.windowSeconds);
  if (count > params.limit) {
    throw tooManyRequests(
      params.message ??
        "Too many connection attempts. Wait a minute and try again."
    );
  }
}
