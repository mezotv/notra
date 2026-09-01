export const COMPANY_LOGO_DEBOUNCE_MS = 500;

export const COMPANY_LOGO_STALE_TIME_MS = 300_000;

/** Bounds repeated fetches for one domain or brand name without pooling unrelated lookups. */
export const COMPANY_LOGO_RATE_LIMIT_PER_QUERY_PER_MINUTE = 5;

export const COMPANY_LOGO_SOURCE_HOSTS = ["media.brand.dev"] as const;

export const COMPANY_LOGO_FETCH_TIMEOUT_MS = 10_000;
