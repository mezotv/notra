const URL_PREFIX = /^https?:\/\//i;
const TRAILING_SLASH = /\/$/;
const URL_SUFFIX = /[?#]/;

export function stripWebsiteProtocol(value: string): string {
  const withoutProtocol = value.trim().replace(URL_PREFIX, "");
  const suffixIndex = withoutProtocol.search(URL_SUFFIX);
  if (suffixIndex !== -1) {
    const pathname = withoutProtocol.slice(0, suffixIndex);
    const suffix = withoutProtocol.slice(suffixIndex);
    return `${pathname.replace(TRAILING_SLASH, "")}${suffix}`;
  }
  return withoutProtocol.replace(TRAILING_SLASH, "");
}

export function normalizeWebsiteUrl(value: string): string | null {
  const host = stripWebsiteProtocol(value);
  if (host.length === 0) {
    return null;
  }
  return `https://${host}`;
}

export function getWebsiteUrlLookupVariants(value: string): string[] {
  const suffixIndex = value.search(URL_SUFFIX);
  if (suffixIndex === -1) {
    return value.endsWith("/")
      ? [value, value.slice(0, -1)]
      : [value, `${value}/`];
  }

  const pathname = value.slice(0, suffixIndex);
  if (pathname.endsWith("/")) {
    return [value, `${pathname.slice(0, -1)}${value.slice(suffixIndex)}`];
  }

  return [value, `${pathname}/${value.slice(suffixIndex)}`];
}

export function areWebsiteUrlsEquivalent(left: string, right: string): boolean {
  return getWebsiteUrlLookupVariants(left).includes(right);
}
