/** Locale pair SerpApi's Google engine expects (`hl` language, `gl` country). */
export interface GeoAiOverviewLocale {
  hl: string;
  gl: string;
}

export interface GeoAiOverviewSource {
  title: string;
  url: string;
  domain: string;
}

/**
 * Parsed Google AI Overview only. Organic results and other SERP modules are
 * dropped on purpose — GEO tracks the overview, not the rest of the page.
 */
export interface GeoAiOverviewParse {
  present: boolean;
  text: string;
  sources: GeoAiOverviewSource[];
  pageToken: string | null;
}

export interface GeoAiOverviewResult {
  present: boolean;
  text: string;
  sources: GeoAiOverviewSource[];
}
