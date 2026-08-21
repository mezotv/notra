"use client";

import { useState } from "react";
import { GEO_DEFAULT_RANGE } from "@/constants/geo";
import type {
  GeoDateRange,
  GeoRangeControl,
  GeoRangePreset,
  GeoRangeState,
} from "@/types/geo";
import {
  geoPresetRange,
  geoRangeLabel,
  geoRangeSpanDays,
  serializeGeoRangeState,
} from "@/utils/geo-range";

export function useGeoRangeDemo(): GeoRangeControl {
  const [state, setState] = useState<GeoRangeState>(() => ({
    preset: GEO_DEFAULT_RANGE,
    range: geoPresetRange(GEO_DEFAULT_RANGE),
  }));

  return {
    ...state,
    label: geoRangeLabel(state),
    days: geoRangeSpanDays(state.range),
    query: { from: state.range.dateFrom, to: state.range.dateTo },
    param: serializeGeoRangeState(state),
    setPreset: (preset: GeoRangePreset) =>
      setState({ preset, range: geoPresetRange(preset) }),
    setCustom: (range: GeoDateRange) => setState({ preset: "custom", range }),
  };
}
