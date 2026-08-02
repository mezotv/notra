import type { GeoPresenceStatus, GeoPromptResult } from "@/types/geo";

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
