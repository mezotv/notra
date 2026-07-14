const WWW_PREFIX_REGEX = /^www\./;
const TWITTER_HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/;
const TWITTER_HOSTS = new Set(["twitter.com", "x.com"]);
const TWITTER_RESERVED_SEGMENTS = new Set([
  "i",
  "home",
  "search",
  "hashtag",
  "intent",
  "explore",
  "share",
]);

export function getReferenceDomain(
  sourceUrl: string | null | undefined
): string | null {
  if (!sourceUrl) {
    return null;
  }
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.hostname.replace(WWW_PREFIX_REGEX, "");
  } catch {
    return null;
  }
}

export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export function getTwitterHandleFromUrl(
  sourceUrl: string | null | undefined
): string | null {
  if (!sourceUrl) {
    return null;
  }
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    const host = parsed.hostname.replace(WWW_PREFIX_REGEX, "");
    if (!TWITTER_HOSTS.has(host)) {
      return null;
    }
    const [firstSegment] = parsed.pathname.split("/").filter(Boolean);
    if (
      !firstSegment ||
      TWITTER_RESERVED_SEGMENTS.has(firstSegment.toLowerCase()) ||
      !TWITTER_HANDLE_REGEX.test(firstSegment)
    ) {
      return null;
    }
    return firstSegment;
  } catch {
    return null;
  }
}

export function getMetadataString(
  metadata: Record<string, unknown> | null,
  key: string
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function getTwitterAvatarUrl(handle: string): string {
  return `https://unavatar.io/x/${encodeURIComponent(handle)}?fallback=false`;
}
