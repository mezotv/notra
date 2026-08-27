import type { PerplexitySearchSource } from "@notra/ui/components/brainless/perplexity/perplexity-search";

import type { GeoAnswerSource } from "@/types/geo";
import { getReferenceDomain } from "@/utils/reference-display";

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL = /\bhttps?:\/\/[^\s)]+/g;

export function perplexitySourcesFromExcerpt(
  excerpt: string
): PerplexitySearchSource[] {
  const seen = new Set<string>();
  const sources: PerplexitySearchSource[] = [];

  for (const match of excerpt.matchAll(MARKDOWN_LINK)) {
    const href = match[2] ?? "";
    const domain = getReferenceDomain(href);
    if (!domain || seen.has(domain)) {
      continue;
    }
    seen.add(domain);
    const title = match[1]?.trim() || domain;
    sources.push({ title, domain, url: href, verified: true });
  }

  for (const match of excerpt.matchAll(BARE_URL)) {
    const href = match[0] ?? "";
    const domain = getReferenceDomain(href);
    if (!domain || seen.has(domain)) {
      continue;
    }
    seen.add(domain);
    sources.push({ title: domain, domain, url: href, verified: true });
  }

  return sources;
}

export function perplexitySourcesFromStored(
  sources: readonly GeoAnswerSource[]
): PerplexitySearchSource[] {
  return sources.flatMap((source) => {
    const domain = getReferenceDomain(source.url);
    if (!domain) {
      return [];
    }
    return [
      {
        title: source.title?.trim() || domain,
        domain,
        url: source.url,
        verified: true,
      },
    ];
  });
}

export function perplexitySourcesFromStoredOrExcerpt(
  sources: readonly GeoAnswerSource[],
  excerpt: string
): PerplexitySearchSource[] {
  const stored = perplexitySourcesFromStored(sources);
  return stored.length > 0 ? stored : perplexitySourcesFromExcerpt(excerpt);
}
