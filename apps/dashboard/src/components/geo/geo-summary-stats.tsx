"use client";

import { useMemo } from "react";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { GEO_ENGINE_LABELS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { GeoStatTile, GeoSummaryStatsProps } from "@/types/geo";
import {
  buildGeoHeroSummary,
  formatMentionRate,
  gapInsight,
} from "@/utils/geo-charts";

export function GeoSummaryStats({
  engines,
  settings,
  promptCount,
}: GeoSummaryStatsProps) {
  const { visibility, visibilityHint, tiles } = useMemo(() => {
    const summary = buildGeoHeroSummary(engines);
    const best = summary.bestEngine;

    const sideTiles: GeoStatTile[] = [
      {
        label: "Best engine",
        value: best ? (GEO_ENGINE_LABELS[best.engine] ?? best.engine) : "N/A",
        hint: best
          ? `${formatMentionRate(best.mentionRate)} mention rate`
          : "run a scan",
      },
      {
        label: "Tracked prompts",
        value: String(promptCount),
        hint: "asked to every engine per scan",
      },
      {
        label: "Competitors watched",
        value: String(settings.competitors.length),
        hint: "named rivals in scans",
      },
    ];

    return {
      visibility:
        summary.visibilityRate === null
          ? "N/A"
          : formatMentionRate(summary.visibilityRate),
      visibilityHint: gapInsight(summary.gapPoints),
      tiles: sideTiles,
    };
  }, [engines, settings.competitors.length, promptCount]);

  return (
    <InstrumentGrid className="grid-cols-2 lg:grid-cols-5">
      <div className="col-span-2 flex flex-col justify-center gap-1 bg-card px-4 py-3">
        <p className="font-mono text-[0.625rem] text-muted-foreground uppercase tracking-[0.14em]">
          AI visibility
        </p>
        <p className="font-mono text-[2.5rem] text-primary tabular-nums leading-none tracking-tight">
          {visibility}
        </p>
        <p className="line-clamp-2 text-[0.6875rem] text-muted-foreground">
          {visibilityHint}
        </p>
      </div>
      {tiles.map((tile, index) => (
        <div
          className={cn(
            "space-y-1 bg-card px-3 py-2.5",
            index === tiles.length - 1 && "col-span-2 lg:col-span-1"
          )}
          key={tile.label}
        >
          <p className="font-mono text-[0.625rem] text-muted-foreground uppercase tracking-[0.14em]">
            {tile.label}
          </p>
          <p className="truncate font-mono text-[1.375rem] leading-none tracking-tight">
            {tile.value}
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">{tile.hint}</p>
        </div>
      ))}
    </InstrumentGrid>
  );
}
