import { competitorKey } from "../geo/domain";

/** Maps canonical competitor names and their synonyms onto the canonical name. */
export function competitorCanonicalMap(
  competitors: readonly {
    name: string;
    synonyms?: readonly string[];
  }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const competitor of competitors) {
    const nameKey = competitorKey(competitor.name);
    if (nameKey.length === 0) {
      continue;
    }
    map.set(nameKey, competitor.name);
    for (const synonym of competitor.synonyms ?? []) {
      const key = competitorKey(synonym);
      if (key.length > 0 && !map.has(key)) {
        map.set(key, competitor.name);
      }
    }
  }
  return map;
}
