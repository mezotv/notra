"use client";

import { Card, CardContent } from "@notra/ui/components/ui/card";
import { useMemo } from "react";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { cn } from "@/lib/utils";
import type { AnalyticsStatTile, SummaryStatsProps } from "@/types/analytics";
import {
  buildAnalyticsHeroSummary,
  formatMetric,
} from "@/utils/analytics-charts";

export function SummaryStats({
  accounts,
  points,
  rangeHint,
}: SummaryStatsProps) {
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
        hint: `across ${accounts.length} connected ${accounts.length === 1 ? "account" : "accounts"}`,
        accent: false,
      },
      {
        label: "Impressions",
        value: formatMetric(summary.impressions),
        hint: `posts, ${rangeHint}`,
        accent: false,
      },
      {
        label: "Interactions",
        value: formatMetric(summary.interactions),
        hint: `${summary.posts} posts, ${rangeHint}`,
        accent: false,
      },
    ];
  }, [accounts, points, rangeHint]);

  return (
    <InstrumentGrid className="grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardContent className="flex flex-1 flex-col justify-center gap-2">
            <p className="font-medium text-muted-foreground text-sm">
              {tile.label}
            </p>
            <p
              className={cn(
                "font-bold text-3xl tabular-nums",
                tile.accent && "text-primary"
              )}
            >
              {tile.value}
            </p>
            <p className="truncate text-muted-foreground text-xs">
              {tile.hint}
            </p>
          </CardContent>
        </Card>
      ))}
    </InstrumentGrid>
  );
}
