import {
  ANALYTICS_RANGE_PRESET_DAYS,
  ANALYTICS_RANGE_PRESETS,
} from "@/constants/analytics";
import type {
  AnalyticsDateRange,
  AnalyticsRangePreset,
  AnalyticsRangeState,
} from "@/types/analytics";

const DAY_PAD_LENGTH = 2;
const MAX_TIMELINE_DAYS = 400;
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

function presetRange(
  preset: Exclude<AnalyticsRangePreset, "custom">
): AnalyticsDateRange {
  const spanDays = ANALYTICS_RANGE_PRESET_DAYS[preset];
  if (preset === "yesterday") {
    return { dateFrom: shiftedDay(1), dateTo: shiftedDay(1) };
  }
  return { dateFrom: shiftedDay(spanDays), dateTo: shiftedDay(0) };
}

function isPresetValue(
  value: string
): value is Exclude<AnalyticsRangePreset, "custom"> {
  return ANALYTICS_RANGE_PRESETS.some((preset) => preset.value === value);
}

export function parseRangeParam(
  value: string,
  fallback: Exclude<AnalyticsRangePreset, "custom">
): AnalyticsRangeState {
  if (isPresetValue(value)) {
    return { preset: value, range: presetRange(value) };
  }
  const match = CUSTOM_PARAM_REGEX.exec(value);
  if (match?.[1] && match[2] && match[1] <= match[2]) {
    return {
      preset: "custom",
      range: { dateFrom: match[1], dateTo: match[2] },
    };
  }
  return { preset: fallback, range: presetRange(fallback) };
}

export function serializeCustomRange(range: AnalyticsDateRange): string {
  return `custom_${range.dateFrom}_${range.dateTo}`;
}

export function rangeLabel(state: AnalyticsRangeState): string {
  if (state.preset !== "custom") {
    const preset = ANALYTICS_RANGE_PRESETS.find(
      (entry) => entry.value === state.preset
    );
    return preset?.compact ?? state.preset;
  }
  const from = rangeLabelFormatter.format(parseLocalDay(state.range.dateFrom));
  const to = rangeLabelFormatter.format(parseLocalDay(state.range.dateTo));
  return from === to ? from : `${from} - ${to}`;
}

export function rangeHintLabel(state: AnalyticsRangeState): string {
  if (state.preset === "custom") {
    return rangeLabel(state);
  }
  const preset = ANALYTICS_RANGE_PRESETS.find(
    (entry) => entry.value === state.preset
  );
  return (preset?.label ?? state.preset).toLowerCase();
}

export function rangeIncludesToday(range: AnalyticsDateRange): boolean {
  return range.dateTo >= localDayString(new Date());
}

export function buildTimelineRange(range: AnalyticsDateRange): string[] {
  const cursor = parseLocalDay(range.dateFrom);
  const end = parseLocalDay(range.dateTo).getTime();
  const result: string[] = [];
  while (cursor.getTime() <= end && result.length < MAX_TIMELINE_DAYS) {
    result.push(localDayString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
