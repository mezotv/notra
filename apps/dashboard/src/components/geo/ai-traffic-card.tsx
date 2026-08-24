"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoRateSparkline } from "@/components/geo/geo-rate-sparkline";
import { PurposeBadge } from "@/components/geo/purpose-badge";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { CHART_PRIMARY_COLOR, CHART_SECONDARY_COLOR } from "@/constants/charts";
import {
  GEO_EMPTY_TRAFFIC_RESPONSE,
  GEO_SPARKLINE_MIN_POINTS,
  GEO_TRAFFIC_TREND_CRAWLER_KEY,
  GEO_TRAFFIC_TREND_CRAWLER_LABEL,
  GEO_TRAFFIC_TREND_REFERRAL_KEY,
  GEO_TRAFFIC_TREND_REFERRAL_LABEL,
} from "@/constants/geo";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { ChartConfig } from "@/types/charts";
import type {
  AiTrafficCardProps,
  GeoTrafficSource,
  GeoTrafficTotals,
  GeoTrafficTrendRow,
} from "@/types/geo";
import {
  buildTrafficSourceSeries,
  buildTrafficTrendRows,
  formatAiTrafficTimestamp,
  formatGeoSource,
  formatMarkdownShare,
  hasTrafficSourceSeries,
  trafficSourceKey,
  trafficSparklineDays,
} from "@/utils/ai-traffic";
import { todayIsoDate } from "@/utils/analytics-charts";
import { seriesColors } from "@/utils/chart-colors";
import { formatChartInteger } from "@/utils/geo-charts";
import { tableHeightFor } from "@/utils/table";

const HERO_CHART_OPTIONS = {
  grid: { left: 4, right: 8, top: 8, bottom: 4, containLabel: true },
};

const TRAFFIC_TREND_STROKE_WIDTH = 1.5;
const TRAFFIC_TREND_TOTAL_KEY = "total";

type TrafficMetricKey =
  | typeof GEO_TRAFFIC_TREND_CRAWLER_KEY
  | typeof GEO_TRAFFIC_TREND_REFERRAL_KEY
  | typeof TRAFFIC_TREND_TOTAL_KEY;

interface TrafficMetricOption {
  key: TrafficMetricKey;
  label: string;
  value: number;
}

function TrafficHero({
  totals,
  rows,
}: {
  totals: GeoTrafficTotals;
  rows: readonly GeoTrafficTrendRow[];
}) {
  const markIncompleteTail = rows.at(-1)?.rawDay === todayIsoDate();
  const showTrend = rows.length >= GEO_SPARKLINE_MIN_POINTS;
  const totalVisits = totals.crawler + totals.aiReferral;

  const metrics: TrafficMetricOption[] = [
    {
      key: GEO_TRAFFIC_TREND_CRAWLER_KEY,
      label: GEO_TRAFFIC_TREND_CRAWLER_LABEL,
      value: totals.crawler,
    },
    {
      key: GEO_TRAFFIC_TREND_REFERRAL_KEY,
      label: GEO_TRAFFIC_TREND_REFERRAL_LABEL,
      value: totals.aiReferral,
    },
    {
      key: TRAFFIC_TREND_TOTAL_KEY,
      label: "Total",
      value: totalVisits,
    },
  ];

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      [GEO_TRAFFIC_TREND_CRAWLER_KEY]: {
        label: GEO_TRAFFIC_TREND_CRAWLER_LABEL,
        colors: seriesColors(CHART_PRIMARY_COLOR),
      },
      [GEO_TRAFFIC_TREND_REFERRAL_KEY]: {
        label: GEO_TRAFFIC_TREND_REFERRAL_LABEL,
        colors: seriesColors(CHART_SECONDARY_COLOR),
      },
    }),
    []
  );
  const chartRows = useMemo(
    () =>
      rows.map((row) => ({
        day: row.day,
        rawDay: row.rawDay,
        [GEO_TRAFFIC_TREND_CRAWLER_KEY]: row.crawler,
        [GEO_TRAFFIC_TREND_REFERRAL_KEY]: row.aiReferral,
      })),
    [rows]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {metrics.map((metric) => (
          <div className="px-5 py-4" key={metric.key}>
            <p className="text-muted-foreground text-xs">{metric.label}</p>
            <div className="mt-1 flex gap-x-2">
              <span className="font-semibold text-3xl tabular-nums leading-none tracking-tight">
                {metric.value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      {showTrend ? (
        <div className="border-border border-t p-4">
          <EChartsAreaChart
            animation={false}
            chartOptions={HERO_CHART_OPTIONS}
            className="h-52 w-full"
            config={chartConfig}
            curveType="monotone"
            data={chartRows}
            xDataKey="day"
          >
            <EChartsAreaChart.Grid />
            <EChartsAreaChart.XAxis dataKey="day" />
            <EChartsAreaChart.YAxis />
            <EChartsAreaChart.Area
              dataKey={GEO_TRAFFIC_TREND_CRAWLER_KEY}
              enableBufferLine={markIncompleteTail}
              strokeVariant="solid"
              strokeWidth={TRAFFIC_TREND_STROKE_WIDTH}
              variant="gradient"
            >
              <EChartsAreaChart.ActiveDot variant="border" />
            </EChartsAreaChart.Area>
            <EChartsAreaChart.Area
              dataKey={GEO_TRAFFIC_TREND_REFERRAL_KEY}
              enableBufferLine={markIncompleteTail}
              strokeVariant="solid"
              strokeWidth={TRAFFIC_TREND_STROKE_WIDTH}
              variant="gradient"
            >
              <EChartsAreaChart.ActiveDot variant="border" />
            </EChartsAreaChart.Area>
            <EChartsAreaChart.Tooltip
              confine={false}
              valueFormatter={formatChartInteger}
            />
          </EChartsAreaChart>
        </div>
      ) : null}
    </div>
  );
}

export function AiTrafficCard({ traffic }: AiTrafficCardProps) {
  const { sources, totals, points } = traffic ?? GEO_EMPTY_TRAFFIC_RESPONSE;
  const trendRows = useMemo(() => buildTrafficTrendRows(points), [points]);
  const sparklineDays = useMemo(() => trafficSparklineDays(points), [points]);
  const canSparkline = hasTrafficSourceSeries(points);
  const seriesBySource = useMemo(() => {
    if (!canSparkline) {
      return new Map<string, { day: string; value: number }[]>();
    }
    const map = new Map<string, { day: string; value: number }[]>();
    for (const source of sources) {
      const values = buildTrafficSourceSeries(
        points,
        source.source,
        source.visitorType,
        sparklineDays
      );
      map.set(
        trafficSourceKey(source.source, source.visitorType),
        sparklineDays.map((day, index) => ({
          day,
          value: values[index] ?? 0,
        }))
      );
    }
    return map;
  }, [canSparkline, points, sources, sparklineDays]);

  const columns = useMemo<TableColumn<GeoTrafficSource>[]>(
    () => [
      {
        key: "source",
        header: "Source",
        width: "1fr",
        sortable: true,
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-2 font-medium text-sm">
            <EngineIcon engine={row.source} />
            <span className="truncate">
              {formatGeoSource(row.source, row.visitorType)}
            </span>
          </span>
        ),
        sortValue: (row) => formatGeoSource(row.source, row.visitorType),
      },
      {
        key: "category",
        header: "Purpose",
        width: "9.5rem",
        sortable: true,
        cell: (row) => <PurposeBadge category={row.category} />,
      },
      {
        key: "visits",
        header: "Visits",
        width: "10.5rem",
        sortable: true,
        cell: (row) => {
          const series = seriesBySource.get(
            trafficSourceKey(row.source, row.visitorType)
          );
          const showSpark =
            series !== undefined && series.length >= GEO_SPARKLINE_MIN_POINTS;

          return (
            <span className="flex items-center gap-2">
              {showSpark ? (
                <GeoRateSparkline
                  className={
                    row.visitorType === "ai_referral"
                      ? "text-geo-memory"
                      : "text-geo-search"
                  }
                  points={series}
                />
              ) : null}
              <span className="text-sm tabular-nums">
                {row.visits.toLocaleString()}
              </span>
            </span>
          );
        },
      },
      {
        key: "markdownVisits",
        header: "Markdown",
        width: "6.75rem",
        sortable: true,
        cell: (row) => {
          if (row.markdownVisits <= 0) {
            return <span className="tabular-nums">-</span>;
          }

          return (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="cursor-default tabular-nums">
                    {formatMarkdownShare(row.markdownVisits, row.visits)}
                  </span>
                }
              />
              <TooltipContent
                align="start"
                className="max-w-xs text-pretty"
                side="top"
              >
                {row.markdownVisits.toLocaleString()} of{" "}
                {row.visits.toLocaleString()} requests asked for markdown via
                the Accept header
              </TooltipContent>
            </Tooltip>
          );
        },
        sortValue: (row) =>
          row.visits === 0 ? 0 : row.markdownVisits / row.visits,
      },
      {
        key: "paths",
        header: "Pages",
        width: "5.625rem",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">{row.paths}</span>
        ),
      },
      {
        key: "lastSeenAt",
        header: "Last seen",
        width: "9.375rem",
        sortable: true,
        cell: (row) => (
          <span className="whitespace-nowrap text-[0.6875rem] text-muted-foreground tabular-nums">
            {formatAiTrafficTimestamp(row.lastSeenAt)}
          </span>
        ),
      },
    ],
    [seriesBySource]
  );

  if (sources.length === 0) {
    return (
      <InstrumentSection eyebrow="Sources">
        <InstrumentEmpty
          message="No AI traffic captured yet"
          seed="geo-traffic-sources"
        />
      </InstrumentSection>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TrafficHero rows={trendRows} totals={totals} />
      <InstrumentSection eyebrow="Sources">
        <Table
          className="rounded-2xl"
          columns={columns}
          data={sources}
          defaultSort={{ key: "visits", direction: "desc" }}
          emptyState="No AI traffic captured yet"
          getRowId={(row) => `${row.visitorType}-${row.source}`}
          height={tableHeightFor(sources.length)}
          resizable
          rowHeight={TABLE_ROW_HEIGHT}
        />
      </InstrumentSection>
    </div>
  );
}
