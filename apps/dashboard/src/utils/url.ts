const TRAILING_SLASHES_REGEX = /\/+$/;

export function normalizeUrl(url: string): string {
  return url.replace(TRAILING_SLASHES_REGEX, "");
}

export function getConfiguredAppUrl(): string | undefined {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!url) {
    return undefined;
  }

  return normalizeUrl(url);
}

export function requireConfiguredAppUrl(): string {
  const url = getConfiguredAppUrl();

  if (!url) {
    throw new Error(
      "App URL not configured. Set NEXT_PUBLIC_APP_URL, APP_URL, or VERCEL_URL."
    );
  }

  return url;
}
