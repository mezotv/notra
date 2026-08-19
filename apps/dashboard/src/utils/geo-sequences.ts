import type { GeoSequenceTurnResult } from "@/types/geo";

export function buildSequenceTurnGroups(
  results: readonly GeoSequenceTurnResult[],
  sequenceId: string | undefined
): [number, GeoSequenceTurnResult[]][] {
  const grouped = new Map<number, GeoSequenceTurnResult[]>();
  for (const result of results) {
    if (result.sequenceId !== sequenceId) {
      continue;
    }
    const entries = grouped.get(result.turn) ?? [];
    entries.push(result);
    grouped.set(result.turn, entries);
  }
  return [...grouped.entries()].sort(([left], [right]) => left - right);
}
