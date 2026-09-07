import type { ChartConfig } from "@/types/charts";
import { seriesColors } from "@/utils/chart-colors";

import { CHART_PRIMARY_COLOR } from "./charts";

export const SENTIMENT_METHODOLOGY =
  "English, single-turn answers · AI-assessed sentiment toward your brand";
export const SENTIMENT_PERCENT = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});
export const SENTIMENT_CHART_CONFIG: ChartConfig = {
  positiveShare: {
    label: "Positive share",
    colors: seriesColors(CHART_PRIMARY_COLOR),
  },
};
