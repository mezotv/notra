const URL_PREFIX = /^https?:\/\//i;

export function stripWebsiteProtocol(value: string): string {
  return value.trim().replace(URL_PREFIX, "");
}

export function normalizeWebsiteUrl(value: string): string | null {
  const host = stripWebsiteProtocol(value);
  if (host.length === 0) {
    return null;
  }
  return `https://${host}`;
}
