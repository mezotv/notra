"use client";

import { Card, CardContent } from "@notra/ui/components/ui/card";
import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
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
        engine: best?.engine,
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
      <Card className="col-span-2">
        <CardContent className="flex flex-1 flex-col justify-center gap-2">
          <p className="font-medium text-muted-foreground text-sm">
            AI visibility
          </p>
          <p className="font-bold text-4xl text-primary tabular-nums">
            {visibility}
          </p>
          <p className="line-clamp-2 text-muted-foreground text-xs">
            {visibilityHint}
          </p>
        </CardContent>
      </Card>
      {tiles.map((tile, index) => (
        <Card
          className={cn(
            index === tiles.length - 1 && "col-span-2 lg:col-span-1"
          )}
          key={tile.label}
        >
          <CardContent className="flex flex-1 flex-col justify-center gap-2">
            <p className="font-medium text-muted-foreground text-sm">
              {tile.label}
            </p>
            <p className="flex items-center gap-2 truncate font-bold text-3xl tabular-nums">
              {tile.engine ? (
                <EngineIcon className="size-6" engine={tile.engine} />
              ) : null}
              {tile.value}
            </p>
            <p className="text-muted-foreground text-xs">{tile.hint}</p>
          </CardContent>
        </Card>
      ))}
    </InstrumentGrid>
  );
}
