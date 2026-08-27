export const COMPANY_LOGO_DEBOUNCE_MS = 500;

export const COMPANY_LOGO_STALE_TIME_MS = 300_000;

/** Covers one GEO project's 25 competitors plus its own brand, with request headroom. */
export const COMPANY_LOGO_RATE_LIMIT_PER_MINUTE = 30;

export const COMPANY_LOGO_SOURCE_HOSTS = ["media.brand.dev"] as const;

export const COMPANY_LOGO_FETCH_TIMEOUT_MS = 10_000;
