import { GEO_DEFAULT_TAB, GEO_TAB_VALUES } from "@/constants/geo";
import type { GeoTab } from "@/types/geo";

export function toGeoTab(value: string): GeoTab {
  return GEO_TAB_VALUES.find((tab) => tab === value) ?? GEO_DEFAULT_TAB;
}
