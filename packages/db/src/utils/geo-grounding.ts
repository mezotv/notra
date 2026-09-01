import {
  EMPTY_GEO_CHECK_GROUNDING,
  GEO_CHECK_GROUNDING_MAX_QUERIES,
  GEO_CHECK_GROUNDING_MAX_SOURCES,
} from "../constants/geo-checks";
import type { GeoCheckGrounding, GeoCheckSource } from "../types/geo-checks";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSource(value: unknown): GeoCheckSource | null {
  if (!isRecord(value)) {
    return null;
  }

  const url = typeof value.url === "string" ? value.url.trim() : "";
  const domain = typeof value.domain === "string" ? value.domain.trim() : "";
  if (!url || !domain) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }

  const title =
    typeof value.title === "string" && value.title.trim().length > 0
      ? value.title.trim()
      : domain;

  return { title, url, domain };
}

export function parseGeoCheckGrounding(value: unknown): GeoCheckGrounding {
  if (!isRecord(value)) {
    return EMPTY_GEO_CHECK_GROUNDING;
  }

  const queries = Array.isArray(value.queries)
    ? value.queries
        .filter((query): query is string => typeof query === "string")
        .map((query) => query.trim())
        .filter((query) => query.length > 0)
        .slice(0, GEO_CHECK_GROUNDING_MAX_QUERIES)
    : [];

  const sources = Array.isArray(value.sources)
    ? value.sources
        .flatMap((source) => {
          const parsed = parseSource(source);
          return parsed ? [parsed] : [];
        })
        .slice(0, GEO_CHECK_GROUNDING_MAX_SOURCES)
    : [];

  if (queries.length === 0 && sources.length === 0) {
    return EMPTY_GEO_CHECK_GROUNDING;
  }

  return { queries, sources };
}
