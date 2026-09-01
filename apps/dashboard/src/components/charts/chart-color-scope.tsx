"use client";

import { useId, useMemo } from "react";

import { buildChartCss } from "@/components/evilcharts/ui/echarts-chart";
import type { ChartColorScopeProps } from "@/types/charts";

export function ChartColorScope({
  config,
  className,
  children,
}: ChartColorScopeProps) {
  const rawId = useId();
  const scopeId = `scope-${rawId.replace(/:/g, "")}`;
  const css = useMemo(() => buildChartCss(scopeId, config), [scopeId, config]);

  return (
    <div className={className} data-chart={scopeId}>
      <style>{css}</style>
      {children}
    </div>
  );
}
