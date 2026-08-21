import { GEO_RANGE_VALUES } from "@/constants/geo";
import type { GeoRange } from "@/types/geo";

export function isGeoRange(value: string): value is GeoRange {
  return (GEO_RANGE_VALUES as readonly string[]).includes(value);
}
