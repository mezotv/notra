import type { AgentTokenUsage } from "@notra/ai/types/agents";

export const EMPTY_AGENT_TOKEN_USAGE: AgentTokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

export function addAgentTokenUsage(
  total: AgentTokenUsage,
  usage: AgentTokenUsage
): AgentTokenUsage {
  return {
    inputTokens: total.inputTokens + usage.inputTokens,
    outputTokens: total.outputTokens + usage.outputTokens,
    totalTokens: total.totalTokens + usage.totalTokens,
    cacheReadTokens: total.cacheReadTokens + usage.cacheReadTokens,
    cacheWriteTokens: total.cacheWriteTokens + usage.cacheWriteTokens,
  };
}
