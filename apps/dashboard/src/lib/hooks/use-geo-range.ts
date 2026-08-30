"use client";

import { GEO_DEFAULT_RANGE } from "@notra/geo-core/constants/geo";
import type { GeoRangePreset } from "@notra/geo-core/types/geo";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";

import type { GeoDateRange, GeoRangeControl } from "@/types/geo";
import {
  geoRangeLabel,
  geoRangeSpanDays,
  parseGeoRangeParam,
  serializeGeoCustomRange,
  serializeGeoRangeState,
} from "@/utils/geo-range";

export function useGeoRange(): GeoRangeControl {
  const [raw, setRaw] = useQueryState(
    "range",
    parseAsString.withDefault(GEO_DEFAULT_RANGE)
  );

  return useMemo(() => {
    const state = parseGeoRangeParam(raw);
    return {
      ...state,
      label: geoRangeLabel(state),
      days: geoRangeSpanDays(state.range),
      query: { from: state.range.dateFrom, to: state.range.dateTo },
      param: serializeGeoRangeState(state),
      setPreset: (preset: GeoRangePreset) => {
        setRaw(preset === GEO_DEFAULT_RANGE ? null : preset);
      },
      setCustom: (range: GeoDateRange) => {
        setRaw(serializeGeoCustomRange(range));
      },
    };
  }, [raw, setRaw]);
}
