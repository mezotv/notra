import { AI_AGENT_SIGNATURES } from "./signatures";
import type { AiAgentMatch } from "./types";

const NORMALIZED_AGENT_SIGNATURES = AI_AGENT_SIGNATURES.map((signature) => ({
  signature,
  userAgents: signature.userAgents.map((token) => token.toLowerCase()),
}));

export function classifyUserAgent(userAgent: string): AiAgentMatch | null {
  const haystack = userAgent.toLowerCase();
  if (!haystack) {
    return null;
  }

  const exact = haystack.trim();
  for (const { signature, userAgents } of NORMALIZED_AGENT_SIGNATURES) {
    for (const needle of userAgents) {
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
