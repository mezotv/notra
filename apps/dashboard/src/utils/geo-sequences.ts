import type {
  GeoSequenceEngineThread,
  GeoSequenceTurnResult,
} from "@/types/geo";

export function buildSequenceEngineThreads(
  results: readonly GeoSequenceTurnResult[],
  sequenceId: string | undefined
): GeoSequenceEngineThread[] {
  const grouped = new Map<string, GeoSequenceTurnResult[]>();
  for (const result of results) {
    if (result.sequenceId !== sequenceId) {
      continue;
    }
    const entries = grouped.get(result.engine) ?? [];
    entries.push(result);
    grouped.set(result.engine, entries);
  }
  return [...grouped.entries()].map(([engine, turns]) => ({
    engine,
    turns: [...turns].sort((left, right) => left.turn - right.turn),
  }));
}
