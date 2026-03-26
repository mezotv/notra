import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

const redis = Redis.fromEnv();

export const ratelimit = {
  free: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:healthcheck",
    limiter: Ratelimit.slidingWindow(2, "1m"),
  }),
  fetchTweet: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:fetch-tweet",
    limiter: Ratelimit.slidingWindow(30, "1m"),
  }),
  importTweets: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:import-tweets",
    limiter: Ratelimit.slidingWindow(20, "1m"),
  }),
};

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
