"use client";

import { useMemo } from "react";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { cn } from "@/lib/utils";
import type { AnalyticsStatTile, SummaryStatsProps } from "@/types/analytics";
import {
  buildAnalyticsHeroSummary,
  formatMetric,
} from "@/utils/analytics-charts";

export function SummaryStats({ accounts, points }: SummaryStatsProps) {
  const tiles = useMemo<AnalyticsStatTile[]>(() => {
    const summary = buildAnalyticsHeroSummary(accounts, points);

    return [
      {
        label: "Engagement rate",
        value:
          summary.engagementRate === null
            ? "N/A"
            : `${summary.engagementRate.toFixed(1)}%`,
        hint: `${formatMetric(summary.interactions)} interactions / ${formatMetric(summary.impressions)} impressions`,
        accent: true,
      },
      {
        label: "Followers",
        value: formatMetric(summary.followers),
        hint: "across connected accounts",
        accent: false,
      },
      {
        label: "Impressions",
        value: formatMetric(summary.impressions),
        hint: "posts from the last 30 days",
        accent: false,
      },
      {
        label: "Interactions",
        value: formatMetric(summary.interactions),
        hint: `${summary.posts} posts, last 30 days`,
        accent: false,
      },
    ];
  }, [accounts, points]);

  return (
    <InstrumentGrid className="grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div className="space-y-1 bg-card px-3 py-2.5" key={tile.label}>
          <p className="font-mono text-[0.625rem] text-muted-foreground uppercase tracking-[0.14em]">
            {tile.label}
          </p>
          <p
            className={cn(
              "font-mono text-[1.625rem] tabular-nums leading-none tracking-tight",
              tile.accent && "text-primary"
            )}
          >
            {tile.value}
          </p>
          <p className="truncate text-[0.6875rem] text-muted-foreground">
            {tile.hint}
          </p>
        </div>
      ))}
    </InstrumentGrid>
  );
}
