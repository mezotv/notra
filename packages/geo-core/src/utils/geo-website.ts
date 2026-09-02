const URL_PREFIX = /^https?:\/\//i;
const TRAILING_SLASH = /\/$/;

export function stripWebsiteProtocol(value: string): string {
  return value.trim().replace(URL_PREFIX, "").replace(TRAILING_SLASH, "");
}

export function normalizeWebsiteUrl(value: string): string | null {
  const host = stripWebsiteProtocol(value);
  if (host.length === 0) {
    return null;
  }
  return `https://${host}`;
}
