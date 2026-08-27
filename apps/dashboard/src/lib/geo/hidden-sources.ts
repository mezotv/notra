import { GEO_HIDDEN_TRAFFIC_SOURCES_PARAM } from "@/constants/geo-hidden-sources";

export function geoHiddenSourceParams(): { excluded_sources: string } {
  return { excluded_sources: GEO_HIDDEN_TRAFFIC_SOURCES_PARAM };
}
