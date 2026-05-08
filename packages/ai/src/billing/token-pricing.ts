import type { Balance } from "autumn-js";
import type { AgentTokenUsage } from "../types/agents";

export interface ModelPricing {
  inputPerMillionTokens: number;
  outputPerMillionTokens: number;
  cacheReadPerMillionTokens: number;
  cacheWritePerMillionTokens: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "anthropic/claude-haiku-4.5": {
    inputPerMillionTokens: 0.8,
    outputPerMillionTokens: 4.0,
    cacheReadPerMillionTokens: 0.08,
    cacheWritePerMillionTokens: 1.0,
  },
  "openai/gpt-5.1-instant": {
    inputPerMillionTokens: 0.1,
    outputPerMillionTokens: 0.4,
    cacheReadPerMillionTokens: 0.05,
    cacheWritePerMillionTokens: 0,
  },
  "openai/gpt-oss-120b": {
    inputPerMillionTokens: 0.1,
    outputPerMillionTokens: 0.4,
    cacheReadPerMillionTokens: 0.05,
    cacheWritePerMillionTokens: 0,
  },
};

const DEFAULT_PRICING: ModelPricing = {
  inputPerMillionTokens: 1.0,
  outputPerMillionTokens: 4.0,
  cacheReadPerMillionTokens: 0.1,
  cacheWritePerMillionTokens: 1.0,
};

export const MARKUP_PERCENT = 10;
const MARKUP_MULTIPLIER = 1 + MARKUP_PERCENT / 100;

const MINIMUM_COST_CENTS = 1;

export function calculateTokenCostCents(
  usage: AgentTokenUsage,
  modelId?: string,
  applyMarkup = true
): number {
  const pricing = getModelPricing(modelId);

  const inputCostDollars =
    (usage.inputTokens / 1_000_000) * pricing.inputPerMillionTokens;
  const outputCostDollars =
    (usage.outputTokens / 1_000_000) * pricing.outputPerMillionTokens;
  const cacheReadCostDollars =
    (usage.cacheReadTokens / 1_000_000) * pricing.cacheReadPerMillionTokens;
  const cacheWriteCostDollars =
    (usage.cacheWriteTokens / 1_000_000) * pricing.cacheWritePerMillionTokens;

  const baseCostDollars =
    inputCostDollars +
    outputCostDollars +
    cacheReadCostDollars +
    cacheWriteCostDollars;

  const multiplier = applyMarkup ? MARKUP_MULTIPLIER : 1;
  const costCents = Math.ceil(baseCostDollars * multiplier * 100);

  return Math.max(costCents, MINIMUM_COST_CENTS);
}

export function shouldApplyMarkup(balance: Balance | null): boolean {
  if (!balance || balance.remaining <= 0) {
    return false;
  }

  if (balance.breakdown?.length) {
    const hasRemainingPlanCredits = balance.breakdown.some(
      (entry) => entry.remaining > 0 && entry.reset?.interval !== "one_off"
    );
    return !hasRemainingPlanCredits;
  }

  return false;
}

export function getModelPricing(modelId?: string): ModelPricing {
  return (modelId && MODEL_PRICING[modelId]) || DEFAULT_PRICING;
}
