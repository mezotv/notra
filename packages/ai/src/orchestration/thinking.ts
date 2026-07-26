import type {
  AutoThinkingLevel,
  StreamProviderOptions,
} from "../types/orchestration";

export function getThinkingProviderOptions(
  modelId: string,
  enableThinking: boolean,
  thinkingLevel: AutoThinkingLevel
): StreamProviderOptions | undefined {
  if (!enableThinking || thinkingLevel === "off") {
    return undefined;
  }

  if (modelId.startsWith("anthropic/")) {
    if (usesAdaptiveThinking(modelId)) {
      return {
        anthropic: {
          thinking: { type: "adaptive" },
          output_config: { effort: thinkingLevel },
        },
      } satisfies StreamProviderOptions;
    }

    return {
      anthropic: {
        thinking: {
          type: "enabled",
          budgetTokens: getAnthropicThinkingBudget(thinkingLevel),
        },
      },
    } satisfies StreamProviderOptions;
  }

  if (modelId.startsWith("openai/")) {
    return {
      openai: {
        reasoningEffort: thinkingLevel,
      },
    } satisfies StreamProviderOptions;
  }

  return undefined;
}

function usesAdaptiveThinking(modelId: string): boolean {
  return (
    modelId.startsWith("anthropic/claude-opus-") ||
    modelId.startsWith("anthropic/claude-sonnet-")
  );
}

function getAnthropicThinkingBudget(thinkingLevel: AutoThinkingLevel): number {
  switch (thinkingLevel) {
    case "low":
      return 1024;
    case "high":
      return 8192;
    case "medium":
      return 4096;
    default:
      return 0;
  }
}
