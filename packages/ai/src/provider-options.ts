import {
  type GatewayOptions,
  gatewayOptionsSchema,
} from "@notra/ai/schemas/provider-options";
import type { generateText } from "ai";

type ProviderOptions = NonNullable<
  Parameters<typeof generateText>[0]["providerOptions"]
>;

const DEFAULT_GATEWAY_FALLBACK_MODELS = ["anthropic/claude-sonnet-4.6"];

export function getGatewayFallbackModels(modelId?: string): string[] {
  if (!modelId) {
    return [...DEFAULT_GATEWAY_FALLBACK_MODELS];
  }

  if (modelId.startsWith("anthropic/claude-opus-")) {
    return ["anthropic/claude-sonnet-4.6"];
  }

  if (modelId.startsWith("anthropic/")) {
    return ["anthropic/claude-haiku-4.5"];
  }

  if (modelId.startsWith("openai/")) {
    return modelId === "openai/gpt-5.4-mini"
      ? ["openai/gpt-5.4-nano"]
      : ["openai/gpt-5.4-mini"];
  }

  return DEFAULT_GATEWAY_FALLBACK_MODELS.filter((model) => model !== modelId);
}

export function withGatewayDefaults(
  providerOptions?: ProviderOptions,
  options?: { modelId?: string; fallbackModels?: string[] }
): ProviderOptions {
  const parsedGatewayOptions = gatewayOptionsSchema.safeParse(
    providerOptions?.gateway
  );
  const existingGatewayOptions = parsedGatewayOptions.success
    ? parsedGatewayOptions.data
    : undefined;
  const existingModels = existingGatewayOptions?.models;
  const fallbackModels =
    options?.fallbackModels ?? getGatewayFallbackModels(options?.modelId);
  const gatewayOptions = {
    ...existingGatewayOptions,
    caching: "auto",
    models:
      existingModels && existingModels.length > 0
        ? existingModels
        : fallbackModels,
  } satisfies GatewayOptions;

  return {
    ...providerOptions,
    gateway: gatewayOptions,
  };
}

export const withGatewayAutomaticCaching = withGatewayDefaults;
