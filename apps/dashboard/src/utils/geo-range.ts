import {
  GEO_DEFAULT_QUERY_DAYS,
  GEO_DEFAULT_RANGE,
  GEO_RANGE_PRESET_DAYS,
  GEO_RANGE_PRESETS,
} from "@/constants/geo";
import type {
  GeoDateRange,
  GeoRangePreset,
  GeoRangeQuery,
  GeoRangeState,
} from "@/types/geo";

const DAY_PAD_LENGTH = 2;
const DAY_MS = 86_400_000;
const CUSTOM_PARAM_REGEX = /^custom_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/;

const rangeLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function localDayString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(DAY_PAD_LENGTH, "0");
  const day = String(date.getDate()).padStart(DAY_PAD_LENGTH, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseLocalDay(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, date ?? 1);
}

function shiftedDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return localDayString(date);
}

export function geoPresetRange(preset: GeoRangePreset): GeoDateRange {
  const today = shiftedDay(0);
  switch (preset) {
    case "yesterday":
      return { dateFrom: shiftedDay(1), dateTo: shiftedDay(1) };
    case "ytd":
      return {
        dateFrom: localDayString(new Date(new Date().getFullYear(), 0, 1)),
        dateTo: today,
      };
    default:
      return {
        dateFrom: shiftedDay(GEO_RANGE_PRESET_DAYS[preset]),
        dateTo: today,
      };
  }
}

export function isGeoRangePreset(value: string): value is GeoRangePreset {
  return GEO_RANGE_PRESETS.some((preset) => preset.value === value);
}

export function parseGeoRangeParam(value: string): GeoRangeState {
  if (isGeoRangePreset(value)) {
    return { preset: value, range: geoPresetRange(value) };
  }
  const match = CUSTOM_PARAM_REGEX.exec(value);
  if (match?.[1] && match[2] && match[1] <= match[2]) {
    return {
      preset: "custom",
      range: { dateFrom: match[1], dateTo: match[2] },
    };
  }
  return {
    preset: GEO_DEFAULT_RANGE,
    range: geoPresetRange(GEO_DEFAULT_RANGE),
  };
}

export function serializeGeoCustomRange(range: GeoDateRange): string {
  return `custom_${range.dateFrom}_${range.dateTo}`;
}

export function serializeGeoRangeState(state: GeoRangeState): string | null {
  if (state.preset === "custom") {
    return serializeGeoCustomRange(state.range);
  }
  return state.preset === GEO_DEFAULT_RANGE ? null : state.preset;
}

export function geoRangeLabel(state: GeoRangeState): string {
  if (state.preset !== "custom") {
    const preset = GEO_RANGE_PRESETS.find(
      (entry) => entry.value === state.preset
    );
    return preset?.label ?? state.preset;
  }
  const from = rangeLabelFormatter.format(parseLocalDay(state.range.dateFrom));
  const to = rangeLabelFormatter.format(parseLocalDay(state.range.dateTo));
  return from === to ? from : `${from} - ${to}`;
}

export function geoRangeSpanDays(range: GeoDateRange): number {
  const span = Math.round(
    (parseLocalDay(range.dateTo).getTime() -
      parseLocalDay(range.dateFrom).getTime()) /
      DAY_MS
  );
  return span + 1;
}

export function toGeoWindowInput(
  range: GeoRangeQuery | undefined
): { from: string; to: string } | { days: number } {
  return range
    ? { from: range.from, to: range.to }
    : { days: GEO_DEFAULT_QUERY_DAYS };
}

export function geoCalendarDefaultMonth(from: Date | undefined): Date {
  if (from) {
    return new Date(from.getFullYear(), from.getMonth(), 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}
