"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import {
  parseRangeParam,
  rangeIncludesToday,
  rangeLabel,
  serializeCustomRange,
} from "@/lib/analytics/date-range";
import type {
  AnalyticsDateRange,
  AnalyticsRangeControl,
  AnalyticsRangePreset,
} from "@/types/analytics";

export function useAnalyticsRange(
  paramKey: string,
  defaultPreset: Exclude<AnalyticsRangePreset, "custom"> = "30d"
): AnalyticsRangeControl {
  const [raw, setRaw] = useQueryState(
    paramKey,
    parseAsString.withDefault(defaultPreset)
  );

  return useMemo(() => {
    const state = parseRangeParam(raw, defaultPreset);
    return {
      ...state,
      label: rangeLabel(state),
      includesToday: rangeIncludesToday(state.range),
      setPreset: (preset: Exclude<AnalyticsRangePreset, "custom">) => {
        setRaw(preset === defaultPreset ? null : preset);
      },
      setCustom: (range: AnalyticsDateRange) => {
        setRaw(serializeCustomRange(range));
      },
    };
  }, [raw, defaultPreset, setRaw]);
}
