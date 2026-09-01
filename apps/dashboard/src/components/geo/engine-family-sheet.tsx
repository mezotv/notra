"use client";

import {
  GEO_AVG_POSITION_LABEL,
  GEO_EMPTY_PROMPT_RESULTS,
  GEO_EMPTY_TIMESERIES,
  GEO_FAMILY_STAT_TREND_HINT,
  GEO_MENTION_RATE_LABEL,
  GEO_MENTIONS_LABEL,
  GEO_SEARCH_LABEL,
  GEO_SPARKLINE_MIN_POINTS,
  GEO_WITHOUT_SEARCH_LABEL,
} from "@notra/geo-core/constants/geo";
import type {
  GeoEngineFamily,
  GeoEngineFamilyTotals,
  GeoEngineMode,
  GeoStatDeltaKind,
  GeoTimeseriesPoint,
} from "@notra/geo-core/types/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";
import { todayIsoDate } from "@notra/geo-core/utils/day-label";
import { engineFamilyLabel } from "@notra/geo-core/utils/geo-engine-family";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
import { useMemo, useState } from "react";

import { Button } from "@/components/button";
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { EngineIcon } from "@/components/geo/engine-icon";
import { FamilyImproveCard } from "@/components/geo/family-improve-card";
import { GeoModeIcon } from "@/components/geo/geo-mode-icon";
import { GeoStatDelta } from "@/components/geo/geo-stat-delta";
import { PromptDetailDialog } from "@/components/geo/prompt-detail-dialog";
import { WriteDialog } from "@/components/geo/writer/write-dialog";
import { Table, type TableColumn } from "@/components/motion/table";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import { CHART_PERCENT_SCALE } from "@/constants/charts";
import {
  GEO_PROMPT_DETAIL_SURFACES,
  GEO_WRITE_DIALOG_ENTRIES,
} from "@/constants/geo-analytics";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { ChartConfig } from "@/types/charts";
import type { WriteDialogInitialState } from "@/types/components/geo-writer";
import type {
  EngineFamilyPromptHit,
  EngineFamilySheetProps,
} from "@/types/geo";
import { geoModeColor, seriesColors } from "@/utils/chart-colors";
import {
  buildEngineFamilyModeTrendRows,
  engineFamilyAvgPosition,
  engineFamilyLastCheckedAt,
  engineFamilyModeTotals,
  engineFamilyStatTrends,
  engineFamilyTotals,
  formatChartPercent,
  formatMentionRate,
  mentionTrendEmptyLabel,
} from "@/utils/geo-charts";
import { familyImproveInsight } from "@/utils/geo-family-improve";
import { geoGapsEngineHref } from "@/utils/geo-paths";
import {
  engineFamilyPromptHits,
  promptTableRowForId,
} from "@/utils/geo-prompts";
import { writeDialogStateFromGap } from "@/utils/geo-write-entry";
import { tableHeightFor } from "@/utils/table";

const FAMILY_TREND_STROKE_WIDTH = 1.5;
const FAMILY_CHART_HEIGHT_CLASS = "h-56 w-full";
const FAMILY_SHEET_CONTENT_CLASS =
  "gap-0 overflow-hidden rounded-xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:border data-[side=right]:sm:max-w-2xl";
const TILE_CLASS = "bg-muted/50 min-w-0 rounded-2xl px-3 py-2.5";

function StatTile({
  label,
  value,
  delta,
  kind,
}: {
  label: string;
  value: string;
  delta: number | null;
  kind: GeoStatDeltaKind;
}) {
  return (
    <div className={TILE_CLASS}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-base font-medium tracking-tight tabular-nums">
          {value}
        </p>
        <GeoStatDelta
          delta={delta}
          hint={GEO_FAMILY_STAT_TREND_HINT}
          kind={kind}
          label={label}
        />
      </div>
    </div>
  );
}

function ModeTile({
  mode,
  label,
  totals,
}: {
  mode: GeoEngineMode;
  label: string;
  totals: GeoEngineFamilyTotals;
}) {
  return (
    <div className={TILE_CLASS}>
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <GeoModeIcon mode={mode} />
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-base font-medium tracking-tight tabular-nums">
          {formatMentionRate(totals.rate)}
        </span>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {totals.mentions}/{totals.checks}
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
      <div className="grid grid-cols-2 gap-2">
        {searchTotals ? (
          <ModeTile
            label={GEO_SEARCH_LABEL}
            mode="search"
            totals={searchTotals}
          />
        ) : null}
        {memoryTotals ? (
          <ModeTile
            label={GEO_WITHOUT_SEARCH_LABEL}
            mode="memory"
            totals={memoryTotals}
          />
        ) : null}
      </div>
      {showTrend ? (
        <EChartsAreaChart
          animation={false}
          className={FAMILY_CHART_HEIGHT_CLASS}
          config={chartConfig}
          curveType="monotone"
          data={rows}
          xDataKey="day"
        >
          <EChartsAreaChart.Grid lineType="solid" />
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

function FamilyStats({
  family,
  points,
}: {
  family: GeoEngineFamily;
  points: readonly GeoTimeseriesPoint[];
}) {
  const totals = engineFamilyTotals(family);
  const position = engineFamilyAvgPosition(family);
  const trends = engineFamilyStatTrends(points, family.family);

  return (
    <div className="grid grid-cols-3 gap-2">
      <StatTile
        delta={trends.ratePts}
        kind="rate"
        label={GEO_MENTION_RATE_LABEL}
        value={totals ? formatMentionRate(totals.rate) : "—"}
      />
      <StatTile
        delta={trends.mentionDelta}
        kind="mentions"
        label={GEO_MENTIONS_LABEL}
        value={totals ? `${totals.mentions}/${totals.checks}` : "—"}
      />
      <StatTile
        delta={trends.positionDelta}
        kind="position"
        label={GEO_AVG_POSITION_LABEL}
        value={position === null ? "—" : `#${position}`}
      />
    </div>
  );
}

function promptResultLabel(hit: EngineFamilyPromptHit): string {
  if (!hit.mentioned) {
    return "Miss";
  }
  return hit.position === null ? "Mentioned" : `#${hit.position}`;
}

function PromptHits({
  hits,
  onOpen,
  onWrite,
}: {
  hits: readonly EngineFamilyPromptHit[];
  onOpen: (promptId: string) => void;
  onWrite?: (hit: EngineFamilyPromptHit) => void;
}) {
  const columns = useMemo<TableColumn<EngineFamilyPromptHit>[]>(() => {
    const next: TableColumn<EngineFamilyPromptHit>[] = [
      {
        key: "prompt",
        header:
          hits.length > 0
            ? `Prompts (${hits.length.toLocaleString()})`
            : "Prompts",
        width: "1fr",
        minWidth: "12rem",
        sortable: true,
        cell: (row) => (
          <TruncateWithTooltip className="text-sm">
            {row.prompt}
          </TruncateWithTooltip>
        ),
        sortValue: (row) => row.prompt,
      },
      {
        key: "result",
        header: "Result",
        width: "6.5rem",
        sortable: true,
        cell: (row) => (
          <span
            className={
              row.mentioned
                ? "text-sm tabular-nums"
                : "text-muted-foreground text-sm tabular-nums"
            }
          >
            {promptResultLabel(row)}
          </span>
        ),
        sortValue: (row) =>
          row.mentioned ? (row.position ?? 0) : Number.MAX_SAFE_INTEGER,
      },
    ];
    if (onWrite) {
      next.push({
        key: "write",
        header: "",
        width: "5.5rem",
        align: "right",
        cell: (row) =>
          row.mentioned ? null : (
            <Button
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => onWrite(row)}
              size="sm"
              variant="ghost"
            >
              Write
            </Button>
          ),
      });
    }
    return next;
  }, [hits.length, onWrite]);

  if (hits.length === 0) {
    return null;
  }

  return (
    <Table
      className="rounded-2xl"
      columns={columns}
      data={[...hits]}
      defaultSort={{ key: "result", direction: "asc" }}
      emptyState="No prompts scanned yet"
      getRowId={(row) => row.promptId}
      height={tableHeightFor(hits.length)}
      onRowClick={(row) => onOpen(row.promptId)}
      rowHeight={TABLE_ROW_HEIGHT}
    />
  );
}

function EngineFamilySheetSession({
  family,
  timeseriesPoints = GEO_EMPTY_TIMESERIES,
  promptResults = GEO_EMPTY_PROMPT_RESULTS,
  organizationSlug,
  open,
  onOpenChange,
}: Omit<EngineFamilySheetProps, "family"> & { family: GeoEngineFamily }) {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [writeInitial, setWriteInitial] =
    useState<WriteDialogInitialState | null>(null);
  const { projectId } = useGeoProjectScope();
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const organization =
    organizationSlug && activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : organizationSlug
        ? getOrganization(organizationSlug)
        : null;
  const organizationId = organization?.id ?? "";
  const canWrite = Boolean(organizationSlug) && Boolean(organizationId);
  const name = engineFamilyLabel(family.family);
  const showVariantHeadings = family.variants.length > 1;
  const lastChecked = engineFamilyLastCheckedAt(family);
  let description = showVariantHeadings
    ? "How each model mentions you"
    : "How this engine mentions you";
  if (lastChecked) {
    description = `Last checked ${formatAiTrafficTimestamp(lastChecked)}`;
  }
  const selectedRow = selectedPromptId
    ? promptTableRowForId(selectedPromptId, promptResults)
    : null;
  const promptHits = useMemo(
    () => engineFamilyPromptHits(family.family, promptResults),
    [family.family, promptResults]
  );
  const missedCount = promptHits.filter((hit) => !hit.mentioned).length;
  const improveInsight = familyImproveInsight({
    familyLabel: name,
    search: engineFamilyModeTotals(family, "search"),
    memory: engineFamilyModeTotals(family, "memory"),
    missed: missedCount,
  });
  const gapsHref =
    canWrite && organizationSlug
      ? geoGapsEngineHref(organizationSlug, family.family, projectId)
      : undefined;

  function handleWrite(hit: EngineFamilyPromptHit) {
    setWriteInitial(
      writeDialogStateFromGap({
        promptId: hit.promptId,
        prompt: hit.prompt,
      })
    );
    setWriteOpen(true);
  }

  return (
    <>
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent className={FAMILY_SHEET_CONTENT_CLASS}>
          <SheetHeader className="bg-muted/50 border-b pr-14">
            <SheetTitle className="flex items-center gap-2">
              <EngineIcon className="size-5" engine={family.family} />
              {name}
            </SheetTitle>
            <SheetDescription className="tabular-nums">
              {description}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <FamilyStats family={family} points={timeseriesPoints} />
            <FamilyTrend family={family} points={timeseriesPoints} />
            {improveInsight ? (
              <FamilyImproveCard gapsHref={gapsHref} insight={improveInsight} />
            ) : null}
            <PromptHits
              hits={promptHits}
              onOpen={setSelectedPromptId}
              onWrite={canWrite ? handleWrite : undefined}
            />
          </div>
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
        surface={GEO_PROMPT_DETAIL_SURFACES.ENGINE_SHEET}
      />
      {organizationSlug && organizationId ? (
        <WriteDialog
          entry={GEO_WRITE_DIALOG_ENTRIES.ENGINE_SHEET}
          initial={writeInitial}
          onOpenChange={setWriteOpen}
          open={writeOpen}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
        />
      ) : null}
    </>
  );
}

export function EngineFamilySheet({
  family,
  timeseriesPoints = GEO_EMPTY_TIMESERIES,
  promptResults = GEO_EMPTY_PROMPT_RESULTS,
  organizationSlug,
  open,
  onOpenChange,
}: EngineFamilySheetProps) {
  if (!family) {
    return (
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent className={FAMILY_SHEET_CONTENT_CLASS} />
      </Sheet>
    );
  }

  return (
    <EngineFamilySheetSession
      family={family}
      key={family.family}
      onOpenChange={onOpenChange}
      open={open}
      organizationSlug={organizationSlug}
      promptResults={promptResults}
      timeseriesPoints={timeseriesPoints}
    />
  );
}
