import { calculateAiCreditCostCents } from "@notra/ai/billing/ai-credit-cost";
import type { AgentTokenUsage } from "@notra/ai/types/agents";
import type { LanguageModelUsage } from "ai";

export const toIrisTokenUsage = (
  usage: LanguageModelUsage | undefined,
  modelId: string
): AgentTokenUsage => {
  const inputTokens = usage?.inputTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? 0;
  const cacheReadTokens = usage?.inputTokenDetails?.cacheReadTokens ?? 0;
  const cacheWriteTokens = usage?.inputTokenDetails?.cacheWriteTokens ?? 0;

  return {
    inputTokens,
    outputTokens,
    totalTokens:
      usage?.totalTokens ??
      inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens,
    cacheReadTokens,
    cacheWriteTokens,
    modelId,
  };
};

export const irisTextCostCents = (
  usage: LanguageModelUsage | undefined,
  modelId: string
): number =>
  calculateAiCreditCostCents(toIrisTokenUsage(usage, modelId), modelId, false)
    .costCents;

export const irisSandboxCostCents = (
  usage: AgentTokenUsage | undefined,
  fallbackModelId: string
): number => {
  if (!usage) {
    return 0;
  }
  return calculateAiCreditCostCents(
    usage,
    usage.modelId ?? fallbackModelId,
    false
  ).costCents;
};
