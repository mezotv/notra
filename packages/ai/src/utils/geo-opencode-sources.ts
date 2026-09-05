import {
  GEO_OPENCODE_HTTP_URL_PATTERN,
  GEO_OPENCODE_MARKDOWN_BOLD_AFFIX_PATTERN,
  GEO_OPENCODE_MARKDOWN_LINK_HREF_PATTERN,
  GEO_OPENCODE_TRAILING_URL_PUNCTUATION_PATTERN,
} from "@notra/ai/constants/geo-opencode";

function normalizeHttpUrl(value: string): string | null {
  const trimmed = value
    .replace(GEO_OPENCODE_MARKDOWN_BOLD_AFFIX_PATTERN, "")
    .replace(GEO_OPENCODE_TRAILING_URL_PUNCTUATION_PATTERN, "");
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function collectHttpUrlsFromString(value: string, urls: Set<string>): void {
  for (const match of value.matchAll(GEO_OPENCODE_HTTP_URL_PATTERN)) {
    const url = normalizeHttpUrl(match[0]);
    if (url) {
      urls.add(url);
    }
  }
  for (const match of value.matchAll(GEO_OPENCODE_MARKDOWN_LINK_HREF_PATTERN)) {
    const url = normalizeHttpUrl(match[1] ?? "");
    if (url) {
      urls.add(url);
    }
  }
}

export function extractHttpUrls(value: unknown): string[] {
  const urls = new Set<string>();
  const visited = new Set<object>();

  const visit = (current: unknown): void => {
    if (typeof current === "string") {
      collectHttpUrlsFromString(current, urls);
      return;
    }
    if (typeof current !== "object" || current === null) {
      return;
    }
    if (visited.has(current)) {
      return;
    }
    visited.add(current);
    for (const nested of Array.isArray(current)
      ? current
      : Object.values(current)) {
      visit(nested);
    }
  };

  visit(value);
  return [...urls];
}
