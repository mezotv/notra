import { GEO_PROMPT_MAX_LENGTH, GEO_PROMPT_MIN_LENGTH } from "@/constants/geo";
import { ONBOARDING_VISIBILITY_MAX_PROMPTS } from "@/constants/onboarding";
import { promptKey } from "@/lib/geo/prompt-key";
import type { GeoOnboardingBrandInput } from "@/types/geo";
import type { VisibilityBrandDraft } from "@/types/onboarding";

export function uniqueVisibilityPrompts(prompts: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const text of prompts) {
    const trimmed = text.trim();
    const length = trimmed.length;
    const key = promptKey(trimmed);
    if (
      length < GEO_PROMPT_MIN_LENGTH ||
      length > GEO_PROMPT_MAX_LENGTH ||
      seen.has(key)
    ) {
      continue;
    }
    seen.add(key);
    unique.push(trimmed);
  }
  return unique.slice(0, ONBOARDING_VISIBILITY_MAX_PROMPTS);
}

export function toVisibilityBrandInput(
  input: VisibilityBrandDraft
): Omit<GeoOnboardingBrandInput, "organizationId" | "projectId"> {
  return {
    companyName: input.companyName.trim(),
    aliases: input.aliases.map((alias) => alias.trim()).filter(Boolean),
    prompts: uniqueVisibilityPrompts(input.prompts),
  };
}
