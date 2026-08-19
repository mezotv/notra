import {
  ACCOUNT_SERIES_COLORS,
  CHART_MUTED_COLOR,
  CHART_OTHER_SLICE_LABEL,
  DONUT_SLICE_COLORS,
} from "@/constants/charts";
import type { ChartColorPair, ChartSeriesColors } from "@/types/charts";

export function seriesColors(pair: ChartColorPair): ChartSeriesColors {
  return { light: [pair.light], dark: [pair.dark] };
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

export function donutSliceColorPair(
  index: number,
  name: string
): ChartColorPair {
  if (name === CHART_OTHER_SLICE_LABEL) {
    return CHART_MUTED_COLOR;
  }
  return (
    DONUT_SLICE_COLORS[index % DONUT_SLICE_COLORS.length] ?? CHART_MUTED_COLOR
  );
}

export function donutSliceColors(
  index: number,
  name: string
): ChartSeriesColors {
  return seriesColors(donutSliceColorPair(index, name));
}
