import {
  ACCOUNT_SERIES_COLORS,
  CHART_MEMORY_FILL_CLASS,
  CHART_MUTED_COLOR,
  CHART_PRIMARY_COLOR,
  CHART_SEARCH_FILL_CLASS,
  CHART_SECONDARY_COLOR,
  MODEL_USAGE_SERIES_COLORS,
} from "@/constants/charts";
import type { ChartColorPair, ChartSeriesColors } from "@/types/charts";

export function seriesColors(pair: ChartColorPair): ChartSeriesColors {
  return { light: [pair.light], dark: [pair.dark] };
}

export function geoModeFillClass(variant: "web" | "raw"): string {
  return variant === "web" ? CHART_SEARCH_FILL_CLASS : CHART_MEMORY_FILL_CLASS;
}

export function geoModeColor(variant: "web" | "raw"): ChartColorPair {
  return variant === "web" ? CHART_PRIMARY_COLOR : CHART_SECONDARY_COLOR;
}

export function accountSeriesColorPair(index: number): ChartColorPair {
  return (
    ACCOUNT_SERIES_COLORS[index % ACCOUNT_SERIES_COLORS.length] ??
    CHART_MUTED_COLOR
  );
}

export function accountSeriesColors(index: number): ChartSeriesColors {
  return seriesColors(accountSeriesColorPair(index));
}

export function modelUsageSeriesColors(index: number): ChartSeriesColors {
  return seriesColors(
    MODEL_USAGE_SERIES_COLORS[index % MODEL_USAGE_SERIES_COLORS.length] ??
      CHART_MUTED_COLOR
  );
}
