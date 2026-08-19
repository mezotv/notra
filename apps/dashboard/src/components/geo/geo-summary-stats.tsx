"use client";

import { Card, CardContent } from "@notra/ui/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { type ReactElement, useMemo } from "react";
import { ChartSparkline } from "@/components/charts/chart-sparkline";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoBar } from "@/components/geo/geo-bar";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { CHART_PRIMARY_COLOR, CHART_SECONDARY_COLOR } from "@/constants/charts";
import {
  GEO_MEMORY_LABEL,
  GEO_SEARCH_LABEL,
  GEO_SPARKLINE_MIN_POINTS,
} from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { ChartColorPair } from "@/types/charts";
import type {
  GeoEngineFamily,
  GeoOverviewEngine,
  GeoSparklinePoint,
  GeoStatTile,
  GeoSummaryStatsProps,
} from "@/types/geo";
import {
  buildGeoHeroSummary,
  engineFamilyLabel,
  engineFamilyTotals,
  formatChartPercent,
  formatMentionRate,
  gapInsight,
  groupEngineFamilies,
  mentionRateSparkline,
  toSparklineSeries,
} from "@/utils/geo-charts";

function familyRate(family: GeoEngineFamily): number {
  return engineFamilyTotals(family)?.rate ?? 0;
}

function bestFamilyOf(families: GeoEngineFamily[]): GeoEngineFamily | null {
  return [...families].sort((a, b) => familyRate(b) - familyRate(a))[0] ?? null;
}

function ModeTrend({
  label,
  engine,
  data,
  color,
  barClassName,
}: {
  label: string;
  engine: GeoOverviewEngine | null;
  data: GeoSparklinePoint[];
  color: ChartColorPair;
  barClassName: string;
}) {
  const values = data.map((point) => point.value);
  const showSparkline = values.length >= GEO_SPARKLINE_MIN_POINTS;

  return (
    <span className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <span
            className={cn("size-1.5 shrink-0 rounded-full", barClassName)}
          />
          <span className="text-muted-foreground">{label}</span>
        </span>
        <span className="tabular-nums">
          {engine
            ? `${formatMentionRate(engine.mentionRate)} · ${engine.mentions}/${engine.checks}`
            : "Not scanned"}
        </span>
      </span>
      {showSparkline && (
        <ChartSparkline className="h-8 w-full" color={color} data={values} />
      )}
      {!showSparkline && engine && (
        <GeoBar
          fillClassName={cn("rounded-full", barClassName)}
          value={engine.mentionRate}
        />
      )}
    </span>
  );
}

function BreakdownTooltip({
  family,
  searchSparkline,
  memorySparkline,
  children,
}: {
  family: GeoEngineFamily;
  searchSparkline: GeoSparklinePoint[];
  memorySparkline: GeoSparklinePoint[];
  children: ReactElement;
}) {
  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger render={children} />
        <TooltipContent className="flex w-56 flex-col gap-3 rounded-xl p-3 text-xs">
          <ModeTrend
            barClassName="bg-chart-1"
            color={CHART_PRIMARY_COLOR}
            data={searchSparkline}
            engine={family.web}
            label={GEO_SEARCH_LABEL}
          />
          <ModeTrend
            barClassName="bg-chart-2"
            color={CHART_SECONDARY_COLOR}
            data={memorySparkline}
            engine={family.raw}
            label={GEO_MEMORY_LABEL}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TileSparkline({ data }: { data: GeoSparklinePoint[] | undefined }) {
  if (!data || data.length < GEO_SPARKLINE_MIN_POINTS) {
    return null;
  }
  const series = toSparklineSeries(data);
  return (
    <div className="mt-auto h-10 w-full overflow-visible">
      <ChartSparkline
        className="h-full w-full"
        color={CHART_PRIMARY_COLOR}
        data={series.data}
        labels={series.labels}
      >
        <ChartSparkline.Tooltip valueFormatter={formatChartPercent} />
      </ChartSparkline>
    </div>
  );
}

export function GeoSummaryStats({
  engines,
  settings,
  promptCount,
  timeseriesPoints,
}: GeoSummaryStatsProps) {
  const tiles = useMemo(() => {
    const summary = buildGeoHeroSummary(engines);
    const best = bestFamilyOf(groupEngineFamilies(engines));
    const visibilitySparkline = mentionRateSparkline(timeseriesPoints);
    const bestSparkline = best
      ? mentionRateSparkline(timeseriesPoints, { family: best.family })
      : [];
    const searchSparkline = best
      ? mentionRateSparkline(timeseriesPoints, {
          family: best.family,
          mode: "search",
        })
      : [];
    const memorySparkline = best
      ? mentionRateSparkline(timeseriesPoints, {
          family: best.family,
          mode: "memory",
        })
      : [];

    return [
      {
        label: "AI visibility",
        value:
          summary.visibilityRate === null
            ? "N/A"
            : formatMentionRate(summary.visibilityRate),
        hint: gapInsight(summary.gapPoints),
        valueClassName: "text-primary",
        sparkline: visibilitySparkline,
      },
      {
        label: "Best engine",
        value: best ? engineFamilyLabel(best.family) : "N/A",
        engine: best?.family,
        family: best ?? undefined,
        hint: best
          ? `${formatMentionRate(familyRate(best))} mention rate`
          : "run a scan",
        sparkline: bestSparkline,
        searchSparkline,
        memorySparkline,
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
    ] satisfies GeoStatTile[];
  }, [engines, settings.competitors.length, promptCount, timeseriesPoints]);

  return (
    <InstrumentGrid className="grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => {
        const value = (
          <span className="min-w-0 truncate tracking-tight">{tile.value}</span>
        );

        return (
          <Card className="h-full min-h-40 min-w-0" key={tile.label}>
            <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5">
              <p className="font-medium text-muted-foreground text-sm">
                {tile.label}
              </p>
              <p
                className={cn(
                  "flex min-w-0 items-center gap-2.5 font-bold text-3xl leading-none",
                  tile.valueClassName,
                  !tile.engine && "tabular-nums"
                )}
              >
                {tile.engine ? (
                  <EngineIcon
                    className="size-6 shrink-0"
                    engine={tile.engine}
                  />
                ) : null}
                {tile.family ? (
                  <BreakdownTooltip
                    family={tile.family}
                    memorySparkline={tile.memorySparkline ?? []}
                    searchSparkline={tile.searchSparkline ?? []}
                  >
                    {value}
                  </BreakdownTooltip>
                ) : (
                  value
                )}
              </p>
              <p className="min-w-0 text-pretty text-[0.6875rem] text-muted-foreground leading-snug">
                {tile.hint}
              </p>
              <TileSparkline data={tile.sparkline} />
            </CardContent>
          </Card>
        );
      })}
    </InstrumentGrid>
  );
}
