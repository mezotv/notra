import { GEO_GAPS_METER_STEPS } from "@notra/ui/constants/geo";
import type { GeoGapsMeterTone } from "@notra/ui/types/geo";

export function gapMeterLevel(
  intensity: number,
  steps = GEO_GAPS_METER_STEPS
): number {
  if (intensity <= 0 || steps <= 0) {
    return 0;
  }
  return Math.max(1, Math.min(steps, Math.round(intensity * steps)));
}

export function gapMeterTone(level: number): GeoGapsMeterTone {
  if (level <= 0) {
    return "empty";
  }
  if (level <= 2) {
    return "low";
  }
  if (level === 3) {
    return "mid";
  }
  return "high";
}
