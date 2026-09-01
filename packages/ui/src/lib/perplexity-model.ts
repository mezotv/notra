import {
  PERPLEXITY_FOCUS_OPTIONS,
  PERPLEXITY_MODELS,
  PERPLEXITY_SEARCH_FOCUS,
  PERPLEXITY_SONAR_MODEL,
} from "../constants/perplexity-models";
import type {
  PerplexityFocusId,
  PerplexityFocusOption,
  PerplexityModelId,
  PerplexityModelOption,
} from "../types/perplexity";

export function getPerplexityModel(id: PerplexityModelId): PerplexityModelOption {
  return PERPLEXITY_MODELS.find((item) => item.id === id) ?? PERPLEXITY_SONAR_MODEL;
}

export function getPerplexityModelsByGroup(
  group: PerplexityModelOption["group"]
): PerplexityModelOption[] {
  return PERPLEXITY_MODELS.filter((item) => item.group === group);
}

export function getPerplexityFocus(id: PerplexityFocusId): PerplexityFocusOption {
  return (
    PERPLEXITY_FOCUS_OPTIONS.find((item) => item.id === id) ??
    PERPLEXITY_SEARCH_FOCUS
  );
}
