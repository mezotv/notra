"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
import { useEffect, useMemo, useState } from "react";
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoModeIcon } from "@/components/geo/geo-mode-icon";
import { PromptDetailDialog } from "@/components/geo/prompt-detail-dialog";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import { CHART_PERCENT_SCALE } from "@/constants/charts";
import {
  GEO_EMPTY_PROMPT_RESULTS,
  GEO_EMPTY_TIMESERIES,
  GEO_SEARCH_LABEL,
  GEO_SPARKLINE_MIN_POINTS,
  GEO_WITHOUT_SEARCH_LABEL,
} from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/types/charts";
import type {
  EngineFamilyPromptHit,
  EngineFamilySheetProps,
  GeoEngineFamily,
  GeoEngineFamilyTotals,
  GeoEngineMode,
  GeoPromptResult,
  GeoTimeseriesPoint,
} from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import { todayIsoDate } from "@/utils/analytics-charts";
import { geoModeColor, seriesColors } from "@/utils/chart-colors";
import {
  buildEngineFamilyModeTrendRows,
  engineFamilyAvgPosition,
  engineFamilyLabel,
  engineFamilyLastCheckedAt,
  engineFamilyModeTotals,
  engineFamilyTotals,
  formatChartPercent,
  formatMentionRate,
  mentionTrendEmptyLabel,
} from "@/utils/geo-charts";
import {
  engineFamilyPromptHits,
  promptTableRowForId,
} from "@/utils/geo-prompts";

const FAMILY_TREND_STROKE_WIDTH = 1.5;

function ModeLegend({
  mode,
  label,
  totals,
}: {
  mode: GeoEngineMode;
  label: string;
  totals: GeoEngineFamilyTotals;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <GeoModeIcon mode={mode} />
        {label}
      </p>
      <p className="mt-0.5 text-sm tabular-nums">
        {formatMentionRate(totals.rate)}
        <span className="text-muted-foreground">
          {" "}
          · {totals.mentions}/{totals.checks}
        </span>
      </p>
    </div>
  );
}

function FamilyTrend({
  family,
  points,
}: {
  family: GeoEngineFamily;
  points: readonly GeoTimeseriesPoint[];
}) {
  const searchTotals = engineFamilyModeTotals(family, "search");
  const memoryTotals = engineFamilyModeTotals(family, "memory");
  const rows = useMemo(
    () => buildEngineFamilyModeTrendRows(points, family.family),
    [family.family, points]
  );
  const showSearch = searchTotals !== null;
  const showMemory = memoryTotals !== null;
  const visibleKeys = [
    ...(showSearch ? (["search"] as const) : []),
    ...(showMemory ? (["memory"] as const) : []),
  ];
  const showTrend = rows.length >= GEO_SPARKLINE_MIN_POINTS;
  const markIncompleteTail = rows.at(-1)?.rawDay === todayIsoDate();
  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    if (showSearch) {
      config.search = {
        label: GEO_SEARCH_LABEL,
        colors: seriesColors(geoModeColor("web")),
      };
    }
    if (showMemory) {
      config.memory = {
        label: GEO_WITHOUT_SEARCH_LABEL,
        colors: seriesColors(geoModeColor("raw")),
      };
    }
    return config;
  }, [showMemory, showSearch]);

  if (!(showSearch || showMemory)) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {searchTotals ? (
          <ModeLegend
            label={GEO_SEARCH_LABEL}
            mode="search"
            totals={searchTotals}
          />
        ) : null}
        {memoryTotals ? (
          <ModeLegend
            label={GEO_WITHOUT_SEARCH_LABEL}
            mode="memory"
            totals={memoryTotals}
          />
        ) : null}
      </div>
      {showTrend ? (
        <EChartsAreaChart
          animation={false}
          className="h-80 w-full"
          config={chartConfig}
          curveType="monotone"
          data={rows}
          xDataKey="day"
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="day" />
          <EChartsAreaChart.YAxis tickFormatter={formatChartPercent} />
          {showSearch ? (
            <EChartsAreaChart.Area
              dataKey="search"
              enableBufferLine={markIncompleteTail}
              strokeVariant="solid"
              strokeWidth={FAMILY_TREND_STROKE_WIDTH}
              variant="gradient"
            >
              <EChartsAreaChart.ActiveDot variant="border" />
            </EChartsAreaChart.Area>
          ) : null}
          {showMemory ? (
            <EChartsAreaChart.Area
              dataKey="memory"
              enableBufferLine={markIncompleteTail}
              strokeVariant="solid"
              strokeWidth={FAMILY_TREND_STROKE_WIDTH}
              variant="gradient"
            >
              <EChartsAreaChart.ActiveDot variant="border" />
            </EChartsAreaChart.Area>
          ) : null}
          <EChartsAreaChart.Tooltip
            barMax={CHART_PERCENT_SCALE}
            confine={false}
            emptyLabel={(row) => mentionTrendEmptyLabel(row, visibleKeys)}
            layout="bars"
            position="fixed"
            rowKeys={visibleKeys}
            valueFormatter={formatChartPercent}
          />
        </EChartsAreaChart>
      ) : null}
    </section>
  );
}

function FamilyStats({ family }: { family: GeoEngineFamily }) {
  const totals = engineFamilyTotals(family);
  const position = engineFamilyAvgPosition(family);

  return (
    <dl className="grid grid-cols-3 gap-3 border-b px-4 py-3">
      <div className="space-y-0.5">
        <dt className="text-muted-foreground text-xs">Mention rate</dt>
        <dd className="font-medium text-base tabular-nums tracking-tight">
          {totals ? formatMentionRate(totals.rate) : "—"}
        </dd>
      </div>
      <div className="space-y-0.5">
        <dt className="text-muted-foreground text-xs">Mentions</dt>
        <dd className="font-medium text-base tabular-nums tracking-tight">
          {totals ? `${totals.mentions}/${totals.checks}` : "—"}
        </dd>
      </div>
      <div className="space-y-0.5">
        <dt className="text-muted-foreground text-xs">Avg position</dt>
        <dd className="font-medium text-base tabular-nums tracking-tight">
          {position === null ? "—" : `#${position}`}
        </dd>
      </div>
    </dl>
  );
}

function PromptHits({
  familyKey,
  results,
  onOpen,
}: {
  familyKey: string;
  results: readonly GeoPromptResult[];
  onOpen: (promptId: string) => void;
}) {
  const hits = useMemo(
    () => engineFamilyPromptHits(familyKey, results),
    [familyKey, results]
  );
  if (hits.length === 0) {
    return null;
  }

  const mentioned = hits.filter((hit) => hit.mentioned).length;
  const missed = hits.length - mentioned;

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <h3 className="font-medium text-sm">Prompts</h3>
        <p className="text-muted-foreground text-xs tabular-nums">
          {mentioned.toLocaleString()} mentioned · {missed.toLocaleString()}{" "}
          missed
        </p>
      </div>
      <ul className="divide-y overflow-hidden rounded-lg border">
        {hits.map((hit) => (
          <PromptHitRow hit={hit} key={hit.promptId} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
}

function PromptHitRow({
  hit,
  onOpen,
}: {
  hit: EngineFamilyPromptHit;
  onOpen: (promptId: string) => void;
}) {
  return (
    <li>
      <button
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
        onClick={() => onOpen(hit.promptId)}
        type="button"
      >
        <span className="min-w-0 flex-1">
          <TruncateWithTooltip className="text-sm">
            {hit.prompt}
          </TruncateWithTooltip>
        </span>
        <span
          className={cn(
            "shrink-0 text-xs tabular-nums",
            hit.mentioned ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {hit.mentioned
            ? hit.position === null
              ? "Mentioned"
              : `#${hit.position}`
            : "Miss"}
        </span>
      </button>
    </li>
  );
}

export function EngineFamilySheet({
  family,
  timeseriesPoints = GEO_EMPTY_TIMESERIES,
  promptResults = GEO_EMPTY_PROMPT_RESULTS,
  open,
  onOpenChange,
}: EngineFamilySheetProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const name = family ? engineFamilyLabel(family.family) : "";
  const showVariantHeadings = (family?.variants.length ?? 0) > 1;
  const lastChecked = family ? engineFamilyLastCheckedAt(family) : null;
  let description = showVariantHeadings
    ? "How each model mentions you"
    : "How this engine mentions you";
  if (lastChecked) {
    description = `Last checked ${formatAiTrafficTimestamp(lastChecked)}`;
  }
  const selectedRow = selectedPromptId
    ? promptTableRowForId(selectedPromptId, promptResults)
    : null;
  const familyKey = family?.family;

  useEffect(() => {
    setSelectedPromptId(null);
  }, [familyKey]);

  return (
    <>
      <Sheet
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedPromptId(null);
          }
          onOpenChange(nextOpen);
        }}
        open={open}
      >
        <SheetContent className="gap-0 overflow-hidden rounded-xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:border data-[side=right]:sm:max-w-2xl">
          {family ? (
            <>
              <SheetHeader className="border-b bg-muted/50 pr-14">
                <SheetTitle className="flex items-center gap-2">
                  <EngineIcon className="size-5" engine={family.family} />
                  {name}
                </SheetTitle>
                <SheetDescription className="tabular-nums">
                  {description}
                </SheetDescription>
              </SheetHeader>
              <FamilyStats family={family} />
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
                <FamilyTrend family={family} points={timeseriesPoints} />
                <PromptHits
                  familyKey={family.family}
                  onOpen={setSelectedPromptId}
                  results={promptResults}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
      <PromptDetailDialog
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedPromptId(null);
          }
        }}
        open={selectedRow !== null}
        row={selectedRow}
      />
    </>
  );
}
