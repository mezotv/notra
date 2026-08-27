import type { GeoCheckGrounding } from "../types/geo-checks";

export const EMPTY_GEO_CHECK_GROUNDING: GeoCheckGrounding = {
  queries: [],
  sources: [],
};

export const GEO_CHECK_GROUNDING_MAX_QUERIES = 8;
export const GEO_CHECK_GROUNDING_MAX_SOURCES = 20;
