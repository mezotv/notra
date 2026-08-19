import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const ratelimit = {
  signIn: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:console-sign-in",
    limiter: Ratelimit.slidingWindow(5, "1m"),
  }),
  socialSignInStart: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:console-social-start",
    limiter: Ratelimit.slidingWindow(10, "1m"),
  }),
};

export function getClientIpFromHeaders(headersList: Headers): string {
  if (process.env.VERCEL !== "1") {
    return `unknown:${crypto.randomUUID()}`;
  }

  return (
    headersList.get("x-vercel-forwarded-for")?.trim() ||
    `unknown:${crypto.randomUUID()}`
  );
}
