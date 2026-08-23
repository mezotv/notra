import { competitorKey } from "@/lib/geo/domain";
import type { GeoCompetitor } from "@/types/geo";

export function findCompetitor(
  competitors: readonly GeoCompetitor[],
  domain: string | null,
  name: string
): GeoCompetitor | undefined {
  const key = competitorKey(name);
  return competitors.find((entry) =>
    domain && entry.domain
      ? entry.domain === domain
      : competitorKey(entry.name) === key
  );
}

export function createCompetitor(
  name: string,
  domain: string | null
): GeoCompetitor {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    domain,
    synonyms: [],
    kind: "direct",
    color: null,
  };
}
