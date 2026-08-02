import { BEACON_SIGNATURES } from "./signatures";
import type { BeaconMatch } from "./types";

export function classifyUserAgent(userAgent: string): BeaconMatch | null {
  const haystack = userAgent.toLowerCase();
  if (!haystack) {
    return null;
  }

  for (const signature of BEACON_SIGNATURES) {
    for (const token of signature.userAgents) {
      if (haystack.includes(token.toLowerCase())) {
        return {
          agent: signature.agent,
          vendor: signature.vendor,
          category: signature.category,
          confidence: signature.confidence,
        };
      }
    }
  }

  return null;
}

export function classifyRequest(
  headers: Headers,
  _ip?: string
): BeaconMatch | null {
  return classifyUserAgent(headers.get("user-agent") ?? "");
}
