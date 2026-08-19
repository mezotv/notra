import type { ChartColorPair } from "@/types/charts";

export const CHART_PRIMARY_COLOR: ChartColorPair = {
  light: "#7C5CF0",
  dark: "#8A6DF1",
};

export const CHART_SECONDARY_COLOR: ChartColorPair = {
  light: "#0D9DAB",
  dark: "#17A0AE",
};

export const CHART_MUTED_COLOR: ChartColorPair = {
  light: "#8A8A94",
  dark: "#9A9AA4",
};

export const ACCOUNT_SERIES_COLORS: readonly ChartColorPair[] = [
  { light: "#358FF3", dark: "#5AA6F6" },
  { light: "#7C5CF0", dark: "#8A6DF1" },
  { light: "#1FA85B", dark: "#3ED187" },
  { light: "#E07B1A", dark: "#FF9F45" },
  { light: "#DB3FA3", dark: "#F062BE" },
  { light: "#DC4343", dark: "#F06A6A" },
  { light: "#6B6B75", dark: "#9A9AA4" },
];

export const DONUT_SLICE_COLORS: readonly ChartColorPair[] = [
  { light: "#7C5CF0", dark: "#8A6DF1" },
  { light: "#9F8AF3", dark: "#A896F4" },
  { light: "#BDB0F6", dark: "#C4B9F7" },
  { light: "#D9D2F9", dark: "#E0DAFB" },
  { light: "#5B3FD0", dark: "#6D53E0" },
];

export const CHART_OTHER_SLICE_LABEL = "Other";

export const SPARKLINE_SERIES_KEY = "value";

export const SPARKLINE_CHART_OPTIONS: Record<string, unknown> = {
  grid: { left: 1, right: 1, top: 2, bottom: 1, containLabel: false },
};

export const DONUT_INNER_RADIUS = "58%";
export const DONUT_OUTER_RADIUS = "82%";

export const COMPETITOR_SWATCHES: readonly string[] = [
  "#7C5CF0",
  "#0D9DAB",
  "#E0632F",
  "#2E9E5B",
  "#D4348B",
  "#C9971B",
  "#3A6FF0",
  "#6B6B75",
];
