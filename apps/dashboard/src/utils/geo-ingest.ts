import {
  GEO_INGEST_DEFAULT_FRAMEWORK,
  GEO_INGEST_SNIPPET_FALLBACK,
} from "@/constants/geo";
import type { GeoIngestFramework, GeoIngestSetupResponse } from "@/types/geo";

export function geoIngestSnippet(
  setup: GeoIngestSetupResponse | undefined,
  framework: GeoIngestFramework = GEO_INGEST_DEFAULT_FRAMEWORK
): string {
  return (
    setup?.snippets?.[framework] ||
    setup?.snippet ||
    GEO_INGEST_SNIPPET_FALLBACK
  );
}
