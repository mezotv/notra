import {
  OPENROUTER_MODEL_ALIASES,
  OPENROUTER_UNSUPPORTED_MODELS,
  VERCEL_NAMESPACE_PREFIX,
  VERCEL_UNSUPPORTED_MODELS,
} from "@notra/ai/constants/router";
import type { GatewayId } from "@notra/ai/types/router";

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
  const neutral = stripVercelNamespace(modelId);
  if (gateway === "vercel") {
    return !VERCEL_UNSUPPORTED_MODELS.has(neutral);
  }
  return !OPENROUTER_UNSUPPORTED_MODELS.has(neutral);
}

export function mapModelId(gateway: GatewayId, modelId: string): string {
  return gateway === "vercel"
    ? toVercelModelId(modelId)
    : toOpenRouterModelId(modelId);
}
