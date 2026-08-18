import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

const redis = Redis.fromEnv();

export const ratelimit = {
  free: new Ratelimit({
    redis,
    prefix: "ratelimit:healthcheck",
    limiter: Ratelimit.slidingWindow(2, "1m"),
  }),
  fetchTweet: new Ratelimit({
    redis,
    prefix: "ratelimit:fetch-tweet",
    limiter: Ratelimit.slidingWindow(30, "1m"),
  }),
  importTweets: new Ratelimit({
    redis,
    prefix: "ratelimit:import-tweets",
    limiter: Ratelimit.slidingWindow(20, "1m"),
  }),
  mcpConnection: new Ratelimit({
    redis,
    prefix: "ratelimit:mcp-connection",
    limiter: Ratelimit.slidingWindow(10, "1m"),
  }),
  githubProbe: new Ratelimit({
    redis,
    prefix: "ratelimit:github-probe",
    limiter: Ratelimit.slidingWindow(30, "1m"),
  }),
  githubAppRepositories: new Ratelimit({
    redis,
    prefix: "ratelimit:github-app-repositories",
    limiter: Ratelimit.slidingWindow(60, "1m"),
  }),
  githubAppCallback: new Ratelimit({
    redis,
    prefix: "ratelimit:github-app-callback",
    limiter: Ratelimit.slidingWindow(10, "1m"),
  }),
  granolaConnection: new Ratelimit({
    redis,
    prefix: "ratelimit:granola-connection",
    limiter: Ratelimit.slidingWindow(10, "1m"),
  }),
  internalWorkflowStart: new Ratelimit({
    redis,
    prefix: "ratelimit:internal-workflow-start",
    limiter: Ratelimit.slidingWindow(30, "1m"),
  }),
  onboardingBrandAnalysis: new Ratelimit({
    redis,
    prefix: "ratelimit:onboarding-brand-analysis",
    limiter: Ratelimit.slidingWindow(2, "10m"),
  }),
  companyLogo: new Ratelimit({
    redis,
    prefix: "ratelimit:company-logo",
    limiter: Ratelimit.slidingWindow(20, "1m"),
  }),
  onboardingAgent: new Ratelimit({
    redis,
    prefix: "ratelimit:onboarding-agent",
    limiter: Ratelimit.slidingWindow(2, "10m"),
  }),
  commandPaletteNavigate: new Ratelimit({
    redis,
    prefix: "ratelimit:cmdk-navigate",
    limiter: Ratelimit.slidingWindow(15, "1m"),
  }),
  chatStream: new Ratelimit({
    redis,
    prefix: "ratelimit:chat-stream",
    limiter: Ratelimit.slidingWindow(30, "1m"),
  }),
  chatStop: new Ratelimit({
    redis,
    prefix: "ratelimit:chat-stop",
    limiter: Ratelimit.slidingWindow(30, "1m"),
  }),
  chatRelay: new Ratelimit({
    redis,
    prefix: "ratelimit:chat-relay",
    limiter: Ratelimit.slidingWindow(20, "1m"),
  }),
  geoIngest: new Ratelimit({
    redis,
    prefix: "ratelimit:geo-ingest",
    limiter: Ratelimit.slidingWindow(1000, "1m"),
  }),
  slackOAuth: new Ratelimit({
    redis,
    prefix: "ratelimit:slack-oauth",
    limiter: Ratelimit.slidingWindow(10, "10m"),
  }),
  signIn: new Ratelimit({
    redis,
    prefix: "ratelimit:auth-sign-in",
    limiter: Ratelimit.slidingWindow(5, "1m"),
  }),
  signUp: new Ratelimit({
    redis,
    prefix: "ratelimit:auth-sign-up",
    limiter: Ratelimit.slidingWindow(5, "1m"),
  }),
  forgotPassword: new Ratelimit({
    redis,
    prefix: "ratelimit:auth-forgot-password",
    limiter: Ratelimit.slidingWindow(3, "1m"),
  }),
  socialSignInStart: new Ratelimit({
    redis,
    prefix: "ratelimit:auth-social-start",
    limiter: Ratelimit.slidingWindow(10, "1m"),
  }),
};

export function getClientIpFromHeaders(headersList: Headers): string {
  if (process.env.VERCEL !== "1") {
    return "unknown";
  }

  return headersList.get("x-vercel-forwarded-for")?.trim() || "unknown";
}

export function getClientIp(request: NextRequest): string {
  // Vercel injects this header at its trusted network boundary. Do not fall
  // back to generic forwarding headers: outside Vercel they are supplied by
  // the client unless the deployment configures its own trusted proxy.
  if (process.env.VERCEL !== "1") {
    return "unknown";
  }

  return request.headers.get("x-vercel-forwarded-for")?.trim() || "unknown";
}
