import type { GeoAnswerSource } from "../types/geo";
import { getReferenceDomain } from "./reference-display";

const CITED_SOURCE_MARKDOWN_AFFIX_PATTERN = /\)\*+$/u;

export interface GeoStoredAnswerSource {
  url: string;
  title: string | null;
}

function citedSourceUrl(url: string): string {
  return url.replace(CITED_SOURCE_MARKDOWN_AFFIX_PATTERN, "");
}

export function geoAnswerSourcesFor(
  grounding: { sources: readonly GeoAnswerSource[] },
  stored: readonly GeoStoredAnswerSource[]
): GeoAnswerSource[] {
  const seen = new Set<string>();
  const sources: GeoAnswerSource[] = [];

  const addSource = (
    title: string | null,
    url: string,
    domain: string | null
  ): void => {
    const href = citedSourceUrl(url);
    if (seen.has(href)) {
      return;
    }
    const resolvedDomain =
      domain && domain.length > 0 ? domain : getReferenceDomain(href);
    seen.add(href);
    sources.push({
      title: title?.trim() || resolvedDomain || href,
      url: href,
      domain: resolvedDomain ?? "",
    });
  };

  if (grounding.sources.length > 0) {
    for (const source of grounding.sources) {
      addSource(source.title, source.url, source.domain);
    }
    return sources;
  }

  for (const source of stored) {
    addSource(source.title, source.url, null);
  }
  return sources;
}
