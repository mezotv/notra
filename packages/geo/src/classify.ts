import { AI_AGENT_SIGNATURES } from "./signatures";
import type { AiAgentMatch } from "./types";

export function classifyUserAgent(userAgent: string): AiAgentMatch | null {
  const haystack = userAgent.toLowerCase();
  if (!haystack) {
    return null;
  }

  const exact = haystack.trim();
  for (const signature of AI_AGENT_SIGNATURES) {
    for (const token of signature.userAgents) {
      const needle = token.toLowerCase();
      const matched =
        signature.match === "exact"
          ? exact === needle
          : haystack.includes(needle);
      if (matched) {
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
): AiAgentMatch | null {
  return classifyUserAgent(headers.get("user-agent") ?? "");
}
