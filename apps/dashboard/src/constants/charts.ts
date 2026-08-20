import type { ChartColorPair } from "@/types/charts";

/** Matches `--primary` / `--geo-search` (Search, own brand, visibility). */
export const CHART_PRIMARY_COLOR: ChartColorPair = {
  light: "#8B5CF6",
  dark: "#8B5CF6",
};

/** Matches `--geo-memory` (ungrounded / without-search mode). */
export const CHART_SECONDARY_COLOR: ChartColorPair = {
  light: "#0D9DAB",
  dark: "#17A0AE",
};

export const CHART_SEARCH_FILL_CLASS = "bg-geo-search";
export const CHART_MEMORY_FILL_CLASS = "bg-geo-memory";

export const CHART_MUTED_COLOR: ChartColorPair = {
  light: "#8A8A94",
  dark: "#9A9AA4",
};

export const ACCOUNT_SERIES_COLORS: readonly ChartColorPair[] = [
  { light: "#358FF3", dark: "#5AA6F6" },
  { light: "#1FA85B", dark: "#3ED187" },
  { light: "#E07B1A", dark: "#FF9F45" },
  { light: "#DB3FA3", dark: "#F062BE" },
  { light: "#DC4343", dark: "#F06A6A" },
  { light: "#C9971B", dark: "#E0B03A" },
  { light: "#6B6B75", dark: "#9A9AA4" },
];

export const MODEL_USAGE_SERIES_COLORS: readonly ChartColorPair[] = [
  { light: "#E85D8A", dark: "#F0719C" },
  { light: "#358FF3", dark: "#5AA6F6" },
  { light: "#1FA85B", dark: "#3ED187" },
  { light: "#E07B1A", dark: "#FF9F45" },
  { light: "#8B5CF6", dark: "#8B5CF6" },
  { light: "#DB3FA3", dark: "#F062BE" },
  { light: "#DC4343", dark: "#F06A6A" },
  { light: "#0D9DAB", dark: "#17A0AE" },
  { light: "#C9971B", dark: "#E0B03A" },
  { light: "#3A6FF0", dark: "#5B8AF5" },
  { light: "#2E9E5B", dark: "#4BC87A" },
  { light: "#D4348B", dark: "#E85BA6" },
];

export const CHART_OTHER_SLICE_LABEL = "Other";

export const CHART_PERCENT_SCALE = 100;

export const CHART_MIN_BAR_PERCENT = 2;

export const SPARKLINE_SERIES_KEY = "value";

export const SPARKLINE_CHART_OPTIONS: Record<string, unknown> = {
  grid: { left: 1, right: 1, top: 2, bottom: 1, containLabel: false },
};

export const DONUT_INNER_RADIUS = "58%";
export const DONUT_OUTER_RADIUS = "82%";

export const COMPETITOR_SWATCHES: readonly string[] = [
  CHART_PRIMARY_COLOR.light,
  CHART_SECONDARY_COLOR.light,
  "#E0632F",
  "#2E9E5B",
  "#D4348B",
  "#C9971B",
  "#3A6FF0",
  "#6B6B75",
];

/** Rivals skip Search (brand) and Memory hues so those roles stay exclusive. */
export const RIVAL_SWATCHES: readonly string[] = COMPETITOR_SWATCHES.slice(2);
