import type { FunnelStage } from "@/components/charts/funnel-chart";
import { GEO_PROMPT_FUNNEL_TOP_POSITION } from "@/constants/geo";
import { trackedPromptScanId } from "@/lib/geo/prompts";
import type {
  GeoPresenceStatus,
  GeoPromptCoverage,
  GeoPromptResult,
  GeoPromptTableRow,
  GeoTrackedPrompt,
} from "@/types/geo";
import { bestFuzzyScore, fuzzyMatches } from "@/utils/fuzzy";
import { summarizePromptResults } from "@/utils/geo-presence";

function promptMentionSets(results: readonly GeoPromptResult[]): {
  mentioned: Set<string>;
  topRanked: Set<string>;
} {
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
  return { mentioned, topRanked };
}

export function promptCoverage(
  promptCount: number,
  results: readonly GeoPromptResult[]
): GeoPromptCoverage {
  const { mentioned } = promptMentionSets(results);
  if (promptCount <= 0) {
    return { mentioned: mentioned.size, total: 0, rate: null };
  }
  return {
    mentioned: mentioned.size,
    total: promptCount,
    rate: mentioned.size / promptCount,
  };
}

export function promptCoverageInsight(coverage: GeoPromptCoverage): string {
  if (coverage.rate === null) {
    return "add prompts to scan";
  }
  if (coverage.mentioned === 0) {
    return "no tracked prompts mentioned yet";
  }
  return `${coverage.mentioned} of ${coverage.total} tracked prompts`;
}

export function buildPromptVisibilityFunnel(
  promptCount: number,
  results: readonly GeoPromptResult[]
): FunnelStage[] {
  const { mentioned, topRanked } = promptMentionSets(results);

  return [
    { label: "Tracked prompts", value: promptCount },
    { label: "Mentioned in an answer", value: mentioned.size },
    {
      label: `Ranked top ${GEO_PROMPT_FUNNEL_TOP_POSITION}`,
      value: topRanked.size,
    },
  ];
}

const PRESENCE_SORT_VALUE: Record<GeoPresenceStatus, number> = {
  "training-data": 3,
  "retrieval-only": 2,
  invisible: 1,
};

export function promptPresenceSortValue(
  status: GeoPresenceStatus | null
): number {
  if (!status) {
    return 0;
  }
  return PRESENCE_SORT_VALUE[status];
}

export function buildPromptTableRows(
  prompts: readonly GeoTrackedPrompt[],
  results: readonly GeoPromptResult[],
  search: string
): GeoPromptTableRow[] {
  const summaries = new Map(
    summarizePromptResults([...results]).map((summary) => [
      summary.promptId,
      summary,
    ])
  );
  const query = search.trim();
  const rows: GeoPromptTableRow[] = [];

  for (const prompt of prompts) {
    if (!fuzzyMatches([prompt.prompt], query)) {
      continue;
    }
    const summary = summaries.get(trackedPromptScanId(prompt));
    rows.push({
      id: prompt.id,
      prompt: prompt.prompt,
      enabled: prompt.enabled,
      source: prompt.source,
      mentioned: summary?.mentioned ?? 0,
      total: summary?.total ?? 0,
      bestPosition: summary?.bestPosition ?? null,
      presence: summary?.presence ?? null,
      results: summary?.results ?? [],
    });
  }

  if (query.length === 0) {
    return rows;
  }

  return rows
    .map((row) => ({ row, score: bestFuzzyScore([row.prompt], query) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.row);
}
