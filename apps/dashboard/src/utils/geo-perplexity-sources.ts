import type { PerplexitySearchSource } from "@notra/ui/components/brainless/perplexity/perplexity-search";
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
