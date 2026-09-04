import type { GeoAnswerSource } from "../types/geo";
import { getReferenceDomain } from "./reference-display";

export interface GeoStoredAnswerSource {
  url: string;
  title: string | null;
}

export function geoAnswerSourcesFor(
  grounding: { sources: readonly GeoAnswerSource[] },
  stored: readonly GeoStoredAnswerSource[]
): GeoAnswerSource[] {
  if (grounding.sources.length > 0) {
    return grounding.sources.map((source) => ({
      title: source.title,
      url: source.url,
      domain: source.domain,
    }));
  }
  const seen = new Set<string>();
  const sources: GeoAnswerSource[] = [];
  for (const source of stored) {
    const domain = getReferenceDomain(source.url);
    if (!domain || seen.has(source.url)) {
      continue;
    }
    seen.add(source.url);
    sources.push({
      title: source.title?.trim() || domain,
      url: source.url,
      domain,
    });
  }
  return sources;
}
