import type { GatewayId } from "./types";

const VERCEL_NAMESPACE_PREFIX = "vercel/";

/**
 * Neutral model id → OpenRouter model id. Most ids are identical
 * (`vendor/model`); this table only lists the exceptions.
 */
export const OPENROUTER_MODEL_ALIASES: Readonly<Record<string, string>> = {
  "google/gemini-3-flash": "google/gemini-3-flash-preview",
};

/**
 * Neutral ids that OpenRouter cannot serve. Requests for these ids fall back
 * to Vercel with reason `unsupported-model`.
 */
export const OPENROUTER_UNSUPPORTED_MODELS: ReadonlySet<string> =
  new Set<string>();

export function stripVercelNamespace(modelId: string): string {
  return modelId.startsWith(VERCEL_NAMESPACE_PREFIX)
    ? modelId.slice(VERCEL_NAMESPACE_PREFIX.length)
    : modelId;
}

export function toOpenRouterModelId(modelId: string): string {
  const neutral = stripVercelNamespace(modelId);
  return OPENROUTER_MODEL_ALIASES[neutral] ?? neutral;
}

export function toVercelModelId(modelId: string): string {
  return modelId;
}

export function isModelSupported(gateway: GatewayId, modelId: string): boolean {
  if (gateway === "vercel") {
    return true;
  }
  return !OPENROUTER_UNSUPPORTED_MODELS.has(stripVercelNamespace(modelId));
}

export function mapModelId(gateway: GatewayId, modelId: string): string {
  return gateway === "vercel"
    ? toVercelModelId(modelId)
    : toOpenRouterModelId(modelId);
}
