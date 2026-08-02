"use client";

import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { Radar } from "@notra/ui/components/dither-kit/radar";
import { RadarChart } from "@notra/ui/components/dither-kit/radar-chart";
import { Tooltip } from "@notra/ui/components/dither-kit/tooltip";
import { useMemo, useState } from "react";
import { ChartSeriesLegend } from "@/components/analytics/chart-legend";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { GEO_ENGINE_LABELS } from "@/constants/geo";
import type { GeoOverviewEngine } from "@/types/geo";
import { groupEngineFamilies } from "@/utils/geo-charts";

interface EngineRadarCardProps {
  engines: GeoOverviewEngine[];
}

interface RadarRow {
  engine: string;
  web: number;
  raw: number;
}

const chartConfig: ChartConfig = {
  web: { label: "With web search", color: "purple" },
  raw: { label: "Model only", color: "grey" },
};

const seriesKeys = Object.keys(chartConfig);
const MIN_AXES = 3;
const WEB_LABEL_SUFFIX = /\s*\(web\)$/;
const PERCENT = 100;

function familyLabel(family: string): string {
  const label =
    GEO_ENGINE_LABELS[family] ?? GEO_ENGINE_LABELS[`${family}-grounded`];
  if (!label) {
    return family;
  }
  return label.replace(WEB_LABEL_SUFFIX, "");
}

export function EngineRadarCard({ engines }: EngineRadarCardProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const rows = useMemo<RadarRow[]>(
    () =>
      groupEngineFamilies(engines).map((family) => ({
        engine: familyLabel(family.family),
        web: Math.round((family.web?.mentionRate ?? 0) * PERCENT),
        raw: Math.round((family.raw?.mentionRate ?? 0) * PERCENT),
      })),
    [engines]
  );

  const visibleKeys = seriesKeys.filter((key) => !hiddenKeys.has(key));

  const toggle = (key: string) => {
    setHiddenKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <InstrumentModule eyebrow="The grounding gap" readout="30D">
      {rows.length < MIN_AXES || visibleKeys.length === 0 ? (
        <InstrumentEmpty
          className="h-56"
          message="Needs scans across 3+ engines"
          seed="The grounding gap"
        />
      ) : (
        <RadarChart
          className="h-56 w-full"
          config={chartConfig}
          data={rows}
          nameKey="engine"
        >
          {visibleKeys.map((key) => (
            <Radar dataKey={key} key={key} />
          ))}
          <Tooltip valueFormatter={(value) => `${value}%`} />
        </RadarChart>
      )}
      <ChartSeriesLegend
        config={chartConfig}
        hiddenKeys={hiddenKeys}
        onToggle={toggle}
        orderedKeys={seriesKeys}
      />
    </InstrumentModule>
  );
}
