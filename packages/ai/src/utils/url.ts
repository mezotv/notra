const TRAILING_SLASHES_REGEX = /\/+$/;

export function normalizeUrl(url: string): string {
  return url.replace(TRAILING_SLASHES_REGEX, "");
}

export function getPortlessUrl(): string | undefined {
  if (process.env.NODE_ENV !== "development" || !process.env.PORTLESS_URL) {
    return undefined;
  }

  return normalizeUrl(process.env.PORTLESS_URL);
}

export function getConfiguredWorkflowUrl(): string | undefined {
  const url = process.env.WORKFLOW_BASE_URL;

  if (!url) {
    return undefined;
  }

  return normalizeUrl(url);
}

export function getConfiguredAppUrl(): string | undefined {
  const url =
    getPortlessUrl() ||
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
