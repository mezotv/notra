import type {
  GeoPresenceStatus,
  GeoPromptResult,
  GeoPromptSummary,
} from "@/types/geo";

const GROUNDED_ENGINE_PATTERN = /(-direct)?-grounded$|^perplexity-sonar$/;

export function isGroundedEngine(engine: string): boolean {
  return GROUNDED_ENGINE_PATTERN.test(engine);
}

export function classifyPromptPresence(
  results: GeoPromptResult[]
): GeoPresenceStatus | null {
  if (results.length === 0) {
    return null;
  }
  let mentionedRaw = false;
  let mentionedWeb = false;
  for (const result of results) {
    if (!result.mentioned) {
      continue;
    }
    if (isGroundedEngine(result.engine)) {
      mentionedWeb = true;
    } else {
      mentionedRaw = true;
    }
  }
  if (mentionedRaw) {
    return "training-data";
  }
  if (mentionedWeb) {
    return "retrieval-only";
  }
  return "invisible";
}

export function summarizePromptResults(
  results: GeoPromptResult[]
): GeoPromptSummary[] {
  const groups = new Map<string, GeoPromptSummary>();
  for (const result of results) {
    const group = groups.get(result.promptId) ?? {
      promptId: result.promptId,
      prompt: result.prompt,
      mentioned: 0,
      total: 0,
      bestPosition: null,
      presence: null,
      results: [],
    };
    group.results.push(result);
    group.total += 1;
    if (result.mentioned) {
      group.mentioned += 1;
    }
    if (
      result.position !== null &&
      (group.bestPosition === null || result.position < group.bestPosition)
    ) {
      group.bestPosition = result.position;
    }
    groups.set(result.promptId, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      presence: classifyPromptPresence(group.results),
    }))
    .sort((a, b) => b.mentioned / b.total - a.mentioned / a.total);
}
