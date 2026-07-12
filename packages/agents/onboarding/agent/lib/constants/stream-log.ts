import path from "node:path";

export const DURABLE_STREAM_STORAGE_PREFIX = "onboarding-agent";
export const DURABLE_STREAM_READ_CONCURRENCY = 20;

export function shouldUseDurableStreamStorage(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}

export function getStreamLogDir(): string {
  return path.join(process.cwd(), "logs", "streams");
}

export function getStreamReportDir(): string {
  return path.join(process.cwd(), "logs", "reports");
}
