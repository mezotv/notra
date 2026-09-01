import {
  MODELS_DEV_LOGO_ALIASES,
  MODELS_DEV_LOGO_BASE,
} from "@notra/ui/constants/geo";
import type { ParsedModelId } from "@notra/ui/types/geo";

export function splitModelId(modelId: string): ParsedModelId | null {
  const trimmed = modelId.trim();
  const separator = trimmed.indexOf("/");
  if (separator <= 0 || separator === trimmed.length - 1) {
    return null;
  }
  return {
    provider: trimmed.slice(0, separator).toLowerCase(),
    slug: trimmed.slice(separator + 1),
  };
}

function modelsDevLogoSlug(provider: string): string {
  const normalized = provider.trim().toLowerCase();
  return MODELS_DEV_LOGO_ALIASES[normalized] ?? normalized;
}

export function modelsDevLogoUrl(provider: string): string {
  return `${MODELS_DEV_LOGO_BASE}/${encodeURIComponent(modelsDevLogoSlug(provider))}.svg`;
}
