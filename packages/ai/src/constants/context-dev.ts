export const BRAND_ANALYSIS_MAX_CONTENT_LENGTH = 80_000;
export const BRAND_ANALYSIS_SITEMAP_MAX_LINKS = 250;
export const BRAND_ANALYSIS_SITEMAP_TIMEOUT_MS = 30_000;
export const BRAND_ANALYSIS_MAX_PAGES = 6;
export const BRAND_ANALYSIS_PAGE_SEPARATOR = "\n\n---\n\n";
export const BRAND_ANALYSIS_WWW_PREFIX = "www.";
export const BRAND_ANALYSIS_EXCLUDED_PATH_PARTS = [
  "/api/",
  "/auth",
  "/blog/",
  "/careers",
  "/changelog",
  "/docs/",
  "/legal",
  "/login",
  "/privacy",
  "/rss",
  "/signin",
  "/signup",
  "/support",
  "/terms",
];
export const BRAND_ANALYSIS_PAGE_WEIGHTS = [
  { pattern: /^\/$/, weight: 100 },
  { pattern: /\/about\/?$/i, weight: 95 },
  { pattern: /\/company\/?$/i, weight: 90 },
  { pattern: /\/brand\/?$/i, weight: 85 },
  { pattern: /\/product\/?$/i, weight: 80 },
  { pattern: /\/platform\/?$/i, weight: 78 },
  { pattern: /\/features?\/?$/i, weight: 75 },
  { pattern: /\/solutions?\/?$/i, weight: 70 },
  { pattern: /\/customers?\/?$/i, weight: 60 },
  { pattern: /\/case-stud(y|ies)\/?$/i, weight: 55 },
  { pattern: /\/pricing\/?$/i, weight: 35 },
];
