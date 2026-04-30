import { getBaseUrl } from "@notra/ai/qstash/triggers";
import { realtime } from "@notra/ai/realtime";

export function canUseUpstashWorkflowStreaming() {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.FORCE_UPSTASH_CHAT_STREAMING !== "true"
  ) {
    return false;
  }

  if (!(realtime && process.env.QSTASH_TOKEN)) {
    return false;
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return false;
  }

  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "[::1]"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
