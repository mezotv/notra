const URL_PREFIX = /^https?:\/\//i;

export function normalizeWebsiteUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return URL_PREFIX.test(trimmed) ? trimmed : `https://${trimmed}`;
}
