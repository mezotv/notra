import type { PerplexitySearchSource } from "@notra/ui/components/brainless/perplexity/perplexity-search";

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL = /\bhttps?:\/\/[^\s)]+/g;
const WWW_PREFIX = /^www\./;

function domainFromHref(href: string): string | null {
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.hostname.replace(WWW_PREFIX, "");
  } catch {
    return null;
  }
}

export function perplexitySourcesFromExcerpt(
  excerpt: string
): PerplexitySearchSource[] {
  const seen = new Set<string>();
  const sources: PerplexitySearchSource[] = [];

  for (const match of excerpt.matchAll(MARKDOWN_LINK)) {
    const href = match[2] ?? "";
    const domain = domainFromHref(href);
    if (!domain || seen.has(domain)) {
      continue;
    }
    seen.add(domain);
    const title = match[1]?.trim() || domain;
    sources.push({ title, domain, url: href, verified: true });
  }

  for (const match of excerpt.matchAll(BARE_URL)) {
    const href = match[0] ?? "";
    const domain = domainFromHref(href);
    if (!domain || seen.has(domain)) {
      continue;
    }
    seen.add(domain);
    sources.push({ title: domain, domain, url: href, verified: true });
  }

  return sources;
}
