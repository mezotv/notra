import type { ReactNode } from "react";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";

export interface ChartColorPair {
  light: string;
  dark: string;
}

export interface ChartSeriesColors {
  light: string[];
  dark: string[];
}

export interface ChartColorScopeProps {
  config: ChartConfig;
  className?: string;
  children: ReactNode;
}

export interface ChartSparklineProps {
  data: number[];
  color: ChartColorPair;
  className?: string;
  markIncompleteTail?: boolean;
}

export interface ChartMarker {
  value: string;
  label: string;
}
