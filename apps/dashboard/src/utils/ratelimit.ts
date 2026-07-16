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
  mcpConnection: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:mcp-connection",
    limiter: Ratelimit.slidingWindow(10, "1m"),
  }),
  onboardingBrandAnalysis: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:onboarding-brand-analysis",
    limiter: Ratelimit.slidingWindow(2, "10m"),
  }),
  onboardingAgent: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:onboarding-agent",
    limiter: Ratelimit.slidingWindow(2, "10m"),
  }),
  commandPaletteNavigate: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:cmdk-navigate",
    limiter: Ratelimit.slidingWindow(15, "1m"),
  }),
};

export function getClientIp(request: NextRequest): string {
  // Vercel injects this header at its trusted network boundary. Do not fall
  // back to generic forwarding headers: outside Vercel they are supplied by
  // the client unless the deployment configures its own trusted proxy.
  if (process.env.VERCEL !== "1") {
    return "unknown";
  }

  return request.headers.get("x-vercel-forwarded-for")?.trim() || "unknown";
}
