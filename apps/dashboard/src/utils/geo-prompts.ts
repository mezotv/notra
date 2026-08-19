import type { FunnelStage } from "@/components/charts/funnel-chart";
import { GEO_PROMPT_FUNNEL_TOP_POSITION } from "@/constants/geo";
import type { GeoPromptResult } from "@/types/geo";

export function buildPromptVisibilityFunnel(
  promptCount: number,
  results: readonly GeoPromptResult[]
): FunnelStage[] {
  const mentioned = new Set<string>();
  const topRanked = new Set<string>();
  for (const result of results) {
    if (!result.mentioned) {
      continue;
    }
    mentioned.add(result.promptId);
    if (
      result.position !== null &&
      result.position <= GEO_PROMPT_FUNNEL_TOP_POSITION
    ) {
      topRanked.add(result.promptId);
    }
  }

  return [
    { label: "Tracked prompts", value: promptCount },
    { label: "Mentioned in an answer", value: mentioned.size },
    {
      label: `Ranked top ${GEO_PROMPT_FUNNEL_TOP_POSITION}`,
      value: topRanked.size,
    },
  ];
}
