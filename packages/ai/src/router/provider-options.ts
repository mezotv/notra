import type { JSONObject, SharedV3ProviderOptions } from "@ai-sdk/provider";
import { toOpenRouterModelId, toVercelModelId } from "./model-ids";
import {
  type BuildProviderOptionsInput,
  type GatewayId,
  ROUTER_PROVIDER_OPTIONS_KEY,
  type RouterProviderOptions,
} from "./types";

const VERCEL_OPTIONS_KEY = "gateway";
const OPENROUTER_OPTIONS_KEY = "openrouter";

type ReasoningEffort = NonNullable<
  RouterProviderOptions["reasoning"]
>["effort"];

const OPENROUTER_EFFORTS: ReadonlySet<string> = new Set([
  "xhigh",
  "high",
  "medium",
  "low",
  "minimal",
  "none",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asObject(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : {};
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

function resolveFallbackModels(
  router: RouterProviderOptions,
  existingModels: unknown,
  mapModel: (modelId: string) => string
): string[] | undefined {
  if (router.fallbackModels && router.fallbackModels.length > 0) {
    return router.fallbackModels.map(mapModel);
  }
  return isStringArray(existingModels) ? existingModels : undefined;
}

/**
 * Split the neutral router block from the caller's provider options.
 */
export function splitRouterOptions(providerOptions?: SharedV3ProviderOptions): {
  router: RouterProviderOptions;
  rest: SharedV3ProviderOptions;
} {
  if (!providerOptions) {
    return { router: {}, rest: {} };
  }

  const { [ROUTER_PROVIDER_OPTIONS_KEY]: rawRouter, ...rest } = providerOptions;
  const router: RouterProviderOptions = {};
  const routerObject = asObject(rawRouter);

  if (routerObject.caching === "auto") {
    router.caching = "auto";
  }
  if (isStringArray(routerObject.fallbackModels)) {
    router.fallbackModels = routerObject.fallbackModels;
  }
  const reasoning = asObject(routerObject.reasoning);
  const effort = reasoning.effort;
  const budgetTokens = reasoning.budgetTokens;
  if (
    (typeof effort === "string" &&
      (effort === "low" || effort === "medium" || effort === "high")) ||
    typeof budgetTokens === "number"
  ) {
    router.reasoning = {
      ...(typeof effort === "string"
        ? { effort: effort as ReasoningEffort }
        : {}),
      ...(typeof budgetTokens === "number" ? { budgetTokens } : {}),
    };
  }

  return { router, rest };
}

/**
 * Remove the other gateway's block so provider-specific options never leak
 * across gateways.
 */
export function stripForeignGatewayOptions(
  gateway: GatewayId,
  providerOptions: SharedV3ProviderOptions
): SharedV3ProviderOptions {
  const foreignKey =
    gateway === "vercel" ? OPENROUTER_OPTIONS_KEY : VERCEL_OPTIONS_KEY;
  if (!(foreignKey in providerOptions)) {
    return providerOptions;
  }
  const { [foreignKey]: _removed, ...rest } = providerOptions;
  return rest;
}

export function buildVercelProviderOptions(
  input: BuildProviderOptionsInput
): SharedV3ProviderOptions {
  const { providerOptions, router, allowNonZdr } = input;
  const existing = asObject(providerOptions[VERCEL_OPTIONS_KEY]);
  const fallbackModels = resolveFallbackModels(
    router,
    existing.models,
    toVercelModelId
  );

  // Production: ZDR + no-training are always forced. Development bypass
  // (allowNonZdr): ZDR is only sent when the caller asks for it explicitly,
  // no-training stays on unless the caller opts out.
  const zeroDataRetention = allowNonZdr
    ? existing.zeroDataRetention === true
    : true;
  const disallowPromptTraining = !(
    allowNonZdr && existing.disallowPromptTraining === false
  );

  const { zeroDataRetention: _ignoredZdr, ...existingWithoutZdr } = existing;
  const gatewayOptions: Record<string, unknown> = {
    ...existingWithoutZdr,
    caching: router.caching ?? existing.caching ?? "auto",
    ...(fallbackModels ? { models: fallbackModels } : {}),
    ...(zeroDataRetention ? { zeroDataRetention: true } : {}),
    disallowPromptTraining,
  };

  return {
    ...stripForeignGatewayOptions("vercel", providerOptions),
    [VERCEL_OPTIONS_KEY]: gatewayOptions as JSONObject,
  };
}

function deriveOpenRouterReasoning(
  router: RouterProviderOptions,
  providerOptions: SharedV3ProviderOptions
): Record<string, unknown> | undefined {
  if (router.reasoning?.budgetTokens) {
    return { max_tokens: router.reasoning.budgetTokens };
  }
  if (router.reasoning?.effort) {
    return { effort: router.reasoning.effort };
  }

  const anthropic = asObject(providerOptions.anthropic);
  const thinking = asObject(anthropic.thinking);
  if (
    thinking.type === "enabled" &&
    typeof thinking.budgetTokens === "number"
  ) {
    return { max_tokens: thinking.budgetTokens };
  }
  if (thinking.type === "adaptive") {
    const outputConfig = asObject(anthropic.output_config);
    const effort = outputConfig.effort;
    if (typeof effort === "string" && OPENROUTER_EFFORTS.has(effort)) {
      return { effort };
    }
    return { enabled: true, effort: "medium" };
  }

  const openai = asObject(providerOptions.openai);
  const reasoningEffort = openai.reasoningEffort;
  if (
    typeof reasoningEffort === "string" &&
    OPENROUTER_EFFORTS.has(reasoningEffort)
  ) {
    return { effort: reasoningEffort };
  }

  return undefined;
}

export function buildOpenRouterProviderOptions(
  input: BuildProviderOptionsInput
): SharedV3ProviderOptions {
  const { providerOptions, router, allowNonZdr } = input;
  const existing = asObject(providerOptions[OPENROUTER_OPTIONS_KEY]);
  const existingProvider = asObject(existing.provider);

  const zdr = allowNonZdr ? existingProvider.zdr === true : true;
  const dataCollection =
    allowNonZdr && existingProvider.data_collection === "allow"
      ? "allow"
      : "deny";

  const { zdr: _ignoredZdr, ...existingProviderWithoutZdr } = existingProvider;
  const provider: Record<string, unknown> = {
    ...existingProviderWithoutZdr,
    ...(zdr ? { zdr: true } : {}),
    data_collection: dataCollection,
  };

  const fallbackModels = resolveFallbackModels(
    router,
    existing.models,
    toOpenRouterModelId
  );

  const reasoning = isObject(existing.reasoning)
    ? existing.reasoning
    : deriveOpenRouterReasoning(router, providerOptions);

  const openrouterOptions: Record<string, unknown> = {
    ...existing,
    provider,
    ...(fallbackModels ? { models: fallbackModels } : {}),
    ...(reasoning ? { reasoning } : {}),
  };

  return {
    ...stripForeignGatewayOptions("openrouter", providerOptions),
    [OPENROUTER_OPTIONS_KEY]: openrouterOptions as JSONObject,
  };
}

/**
 * Attach the neutral router block to caller provider options.
 */
export function withRouterProviderOptions(
  providerOptions: SharedV3ProviderOptions | undefined,
  router: RouterProviderOptions
): SharedV3ProviderOptions {
  const existing = asObject(providerOptions?.[ROUTER_PROVIDER_OPTIONS_KEY]);
  return {
    ...providerOptions,
    [ROUTER_PROVIDER_OPTIONS_KEY]: { ...existing, ...router } as JSONObject,
  };
}
