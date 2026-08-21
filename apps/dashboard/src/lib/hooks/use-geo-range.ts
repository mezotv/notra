"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";
import {
  GEO_DEFAULT_RANGE,
  GEO_RANGE_DAYS,
  GEO_RANGE_VALUES,
} from "@/constants/geo";
import type { GeoRange, GeoRangeControl } from "@/types/geo";

export function useGeoRange(): GeoRangeControl {
  const [range, setRange] = useQueryState(
    "range",
    parseAsStringLiteral(GEO_RANGE_VALUES).withDefault(GEO_DEFAULT_RANGE)
  );

  return useMemo(
    () => ({
      range,
      days: GEO_RANGE_DAYS[range],
      setRange: (next: GeoRange) => {
        setRange(next === GEO_DEFAULT_RANGE ? null : next);
      },
    }),
    [range, setRange]
  );
}
