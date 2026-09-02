const URL_PREFIX = /^https?:\/\//i;
const TRAILING_SLASH = /\/$/;
const URL_SUFFIX = /[?#]/;

export function stripWebsiteProtocol(value: string): string {
  const withoutProtocol = value.trim().replace(URL_PREFIX, "");
  const suffixIndex = withoutProtocol.search(URL_SUFFIX);
  if (suffixIndex !== -1) {
    return withoutProtocol;
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
