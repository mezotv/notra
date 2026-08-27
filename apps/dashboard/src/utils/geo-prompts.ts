import { GEO_PROMPT_FUNNEL_TOP_POSITION } from "@/constants/geo";
import { trackedPromptScanId } from "@/lib/geo/prompts";
import type {
  EngineFamilyPromptHit,
  GeoPresenceStatus,
  GeoPromptCoverage,
  GeoPromptResult,
  GeoPromptTableRow,
  GeoTrackedPrompt,
} from "@/types/geo";
import { bestFuzzyScore, fuzzyMatches } from "@/utils/fuzzy";
import { engineFamilyOf } from "@/utils/geo-charts";
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

export function bestMentionedResult(
  results: readonly GeoPromptResult[]
): GeoPromptResult | null {
  let best: GeoPromptResult | null = null;
  for (const result of results) {
    if (!result.mentioned) {
      continue;
    }
    if (
      best === null ||
      (result.position ?? Number.MAX_SAFE_INTEGER) <
        (best.position ?? Number.MAX_SAFE_INTEGER)
    ) {
      best = result;
    }
  }
  return best;
}

export function engineFamilyPromptHits(
  family: string,
  results: readonly GeoPromptResult[]
): EngineFamilyPromptHit[] {
  const byPrompt = new Map<string, GeoPromptResult[]>();
  for (const result of results) {
    if (engineFamilyOf(result.engine) !== family) {
      continue;
    }
    const group = byPrompt.get(result.promptId) ?? [];
    group.push(result);
    byPrompt.set(result.promptId, group);
  }

  const rows: EngineFamilyPromptHit[] = [];
  for (const [promptId, group] of byPrompt) {
    const mentioned = bestMentionedResult(group);
    const first = group[0];
    if (!first) {
      continue;
    }
    rows.push({
      promptId,
      prompt: first.prompt,
      mentioned: mentioned !== null,
      position: mentioned?.position ?? null,
    });
  }

  return rows.sort((left, right) => {
    if (left.mentioned !== right.mentioned) {
      return left.mentioned ? 1 : -1;
    }
    if (left.position === null && right.position === null) {
      return left.prompt.localeCompare(right.prompt);
    }
    if (left.position === null) {
      return 1;
    }
    if (right.position === null) {
      return -1;
    }
    return left.position - right.position;
  });
}

export function promptTableRowForId(
  promptId: string,
  results: readonly GeoPromptResult[]
): GeoPromptTableRow | null {
  const group = results.filter((result) => result.promptId === promptId);
  const first = group[0];
  if (!first) {
    return null;
  }
  const mentioned = group.filter((result) => result.mentioned);
  const best = bestMentionedResult(group);
  return {
    id: promptId,
    prompt: first.prompt,
    enabled: true,
    source: "auto",
    mentioned: mentioned.length,
    total: group.length,
    bestPosition: best?.position ?? null,
    presence: null,
    results: group,
  };
}
