import { calculateAiCreditCostCents } from "@notra/ai/billing/ai-credit-cost";
import type { AgentTokenUsage } from "@notra/ai/types/agents";
import type { LanguageModelUsage } from "ai";

export const toIrisTokenUsage = (
  usage: LanguageModelUsage | undefined,
  modelId: string
): AgentTokenUsage => {
  const rawInputTokens = usage?.inputTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? 0;
  const cacheReadTokens = usage?.inputTokenDetails?.cacheReadTokens ?? 0;
  const cacheWriteTokens = usage?.inputTokenDetails?.cacheWriteTokens ?? 0;
  const inputTokens = Math.max(
    0,
    rawInputTokens - cacheReadTokens - cacheWriteTokens
  );

  return {
    inputTokens,
    outputTokens,
    totalTokens: usage?.totalTokens ?? rawInputTokens + outputTokens,
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
  const normalized: AgentTokenUsage = {
    ...usage,
    inputTokens: Math.max(
      0,
      usage.inputTokens - usage.cacheReadTokens - usage.cacheWriteTokens
    ),
  };
  const result = calculateAiCreditCostCents(
    normalized,
    usage.modelId ?? fallbackModelId,
    false
  );
  return Math.max(result.costCents, result.tokenCostCents);
};
