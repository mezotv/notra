import {
  MODEL_HYPHEN_PREFIXES,
  MODEL_TOKEN_LABELS,
  MODELS_DEV_LOGO_ALIASES,
  MODELS_DEV_LOGO_BASE,
} from "@/constants/geo-models";
import type { ParsedModelId } from "@/types/geo";
import { engineFamilyLabel } from "@/utils/geo-charts";

const VERSION_TOKEN = /^v?\d/i;
const ALPHA_TOKEN = /^[a-z]+$/i;
const ALPHA_PREFIX_WITH_DIGITS = /^([a-z]+)(\d.*)$/i;

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

// Tracked engines carry a curated label (GEO_ENGINE_LABELS); fall back to the
// slug-derived label so the same engine id reads identically across cards.
export function formatModelLabel(modelId: string): string {
  const trimmed = modelId.trim();
  const engineLabel = engineFamilyLabel(trimmed);
  if (engineLabel !== trimmed) {
    return engineLabel;
  }
  const parsed = splitModelId(trimmed);
  return formatModelSlug(parsed?.slug ?? trimmed);
}

function formatModelSlug(slug: string): string {
  const parts = slug.split("-").filter((part) => part.length > 0);
  if (parts.length === 0) {
    return slug;
  }

  const labels = parts.map(formatModelToken);
  let result = labels[0] ?? slug;
  for (let index = 1; index < labels.length; index++) {
    const previous = parts[index - 1]?.toLowerCase() ?? "";
    const current = parts[index]?.toLowerCase() ?? "";
    const label = labels[index];
    if (!label) {
      continue;
    }
    if (MODEL_HYPHEN_PREFIXES.has(previous) && VERSION_TOKEN.test(current)) {
      result += `-${label}`;
      continue;
    }
    result += ` ${label}`;
  }
  return result;
}

function formatModelToken(token: string): string {
  const lower = token.toLowerCase();
  const known = MODEL_TOKEN_LABELS[lower];
  if (known) {
    return known;
  }
  if (ALPHA_TOKEN.test(token)) {
    return `${token.charAt(0).toUpperCase()}${token.slice(1).toLowerCase()}`;
  }
  // Mixed tokens ("qwen3", "o3", "4o", "5.4"): reuse a known label for the
  // alphabetic prefix when there is one, otherwise keep the token as written.
  const match = ALPHA_PREFIX_WITH_DIGITS.exec(lower);
  if (match) {
    const [, prefix = "", rest = ""] = match;
    const prefixLabel = MODEL_TOKEN_LABELS[prefix];
    if (prefixLabel) {
      return `${prefixLabel}${rest}`;
    }
  }
  return lower;
}
