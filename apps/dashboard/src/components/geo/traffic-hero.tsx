"use client";

import { useState } from "react";

import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { GeoStatDelta } from "@/components/geo/geo-stat-delta";
import { TrafficProviderLegend } from "@/components/geo/traffic-provider-legend";
import { CHART_PRIMARY_COLOR, CHART_SECONDARY_COLOR } from "@/constants/charts";
import {
  GEO_SPARKLINE_MIN_POINTS,
  GEO_TRAFFIC_TREND_CRAWLER_KEY,
  GEO_TRAFFIC_TREND_CRAWLER_LABEL,
  GEO_TRAFFIC_TREND_REFERRAL_KEY,
  GEO_TRAFFIC_TREND_REFERRAL_LABEL,
  GEO_TRAFFIC_TREND_TOTAL_KEY,
  GEO_TRAFFIC_TREND_TOTAL_LABEL,
} from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { ChartConfig, TooltipRowGroup } from "@/types/charts";
import type { TrafficHeroProps, TrafficTrendMetric } from "@/types/geo";
import { trafficSparklineDays, trafficVisitDelta } from "@/utils/ai-traffic";
import {
  buildTrafficTrendProviders,
  buildTrafficTrendRowsForProviders,
  buildTrafficTrendSeries,
  toggleTrafficTrendKey,
  trafficTrendProviderTypeKey,
} from "@/utils/ai-traffic-trend";
import { todayIsoDate } from "@/utils/analytics-charts";
import { seriesColors } from "@/utils/chart-colors";
import { engineIconHtml } from "@/utils/engine-icon-html";
import { formatChartInteger } from "@/utils/geo-charts";

const HERO_CHART_OPTIONS = {
  grid: { left: 4, right: 8, top: 8, bottom: 4, containLabel: true },
};

const TRAFFIC_TREND_STROKE_WIDTH = 1.5;

function metricDelta(current: number, previous: number | null): number | null {
  return previous === null ? null : trafficVisitDelta(current, previous);
}

export function TrafficHero({
  totals,
  previousTotals,
  rows,
  groups,
  points,
}: TrafficHeroProps) {
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const markIncompleteTail = rows.at(-1)?.rawDay === todayIsoDate();
  const showTrend = rows.length >= GEO_SPARKLINE_MIN_POINTS;
  const days = trafficSparklineDays(points);
  const totalVisits = totals.crawler + totals.aiReferral;
  const previousTotalVisits =
    previousTotals === null
      ? null
      : previousTotals.crawler + previousTotals.aiReferral;

  const metrics: TrafficTrendMetric[] = [
    {
      key: GEO_TRAFFIC_TREND_CRAWLER_KEY,
      label: GEO_TRAFFIC_TREND_CRAWLER_LABEL,
      value: totals.crawler,
      delta: metricDelta(totals.crawler, previousTotals?.crawler ?? null),
    },
    {
      key: "ai_referral",
      label: GEO_TRAFFIC_TREND_REFERRAL_LABEL,
      value: totals.aiReferral,
      delta: metricDelta(totals.aiReferral, previousTotals?.aiReferral ?? null),
    },
    {
      key: GEO_TRAFFIC_TREND_TOTAL_KEY,
      label: GEO_TRAFFIC_TREND_TOTAL_LABEL,
      value: totalVisits,
      delta: metricDelta(totalVisits, previousTotalVisits),
    },
  ];

  const providers = buildTrafficTrendProviders(
    groups.flatMap((group) => group.members)
  );
  const providerSeries = buildTrafficTrendSeries(providers);
  const chartRows = buildTrafficTrendRowsForProviders(
    points,
    providers,
    days,
    hiddenKeys
  );
  const config: ChartConfig = {
    [GEO_TRAFFIC_TREND_CRAWLER_KEY]: {
      label: GEO_TRAFFIC_TREND_CRAWLER_LABEL,
      colors: seriesColors(CHART_PRIMARY_COLOR),
    },
    [GEO_TRAFFIC_TREND_REFERRAL_KEY]: {
      label: GEO_TRAFFIC_TREND_REFERRAL_LABEL,
      colors: seriesColors(CHART_SECONDARY_COLOR),
    },
    ...Object.fromEntries(
      providerSeries.flatMap((entry) => {
        const item = {
          label: entry.label,
          colors: entry.colors,
          ...(entry.icon === null
            ? {}
            : { indicatorHtml: engineIconHtml(entry.icon, false) }),
        };
        return [
          [entry.key, item],
          [trafficTrendProviderTypeKey(entry.key, "crawler"), item],
          [trafficTrendProviderTypeKey(entry.key, "ai_referral"), item],
        ];
      })
    ),
  };
  const visibleProviders = providerSeries.filter(
    (entry) => !hiddenKeys.has(entry.key)
  );
  const tooltipGroups: TooltipRowGroup[] = [
    {
      headingKey: GEO_TRAFFIC_TREND_CRAWLER_KEY,
      rowKeys: visibleProviders.map((entry) =>
        trafficTrendProviderTypeKey(entry.key, "crawler")
      ),
    },
    {
      headingKey: GEO_TRAFFIC_TREND_REFERRAL_KEY,
      rowKeys: visibleProviders.map((entry) =>
        trafficTrendProviderTypeKey(entry.key, "ai_referral")
      ),
    },
  ];
  const anyVisible = providerSeries.some((entry) => !hiddenKeys.has(entry.key));

  return (
    <div>
      <div
        className={cn(
          "divide-border grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0",
          showTrend
            ? "border-border bg-muted rounded-t-2xl border border-b-0 pb-5"
            : "border-border bg-card overflow-hidden rounded-2xl border"
        )}
      >
        {metrics.map((metric) => (
          <div className="px-5 py-4" key={metric.key}>
            <p className="text-muted-foreground text-xs">{metric.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
                {metric.value.toLocaleString()}
              </span>
              <GeoStatDelta
                className="mb-0.5"
                delta={metric.delta}
                hint="vs. previous period"
                label={metric.label}
              />
            </div>
          </div>
        ))}
      </div>
      {showTrend ? (
        <div className="border-border bg-card -mt-5 rounded-2xl border p-4">
          <EChartsAreaChart
            animation={false}
            chartOptions={HERO_CHART_OPTIONS}
            className="h-72 w-full"
            config={config}
            curveType="monotone"
            data={chartRows}
            xDataKey="day"
          >
            <EChartsAreaChart.Grid variant="solid" />
            <EChartsAreaChart.XAxis dataKey="day" />
            <EChartsAreaChart.YAxis />
            <EChartsAreaChart.Area
              dataKey={GEO_TRAFFIC_TREND_CRAWLER_KEY}
              enableBufferLine={markIncompleteTail}
              strokeVariant="solid"
              strokeWidth={TRAFFIC_TREND_STROKE_WIDTH}
              variant="gradient"
              visible={anyVisible}
            >
              <EChartsAreaChart.ActiveDot variant="border" />
            </EChartsAreaChart.Area>
            <EChartsAreaChart.Area
              dataKey={GEO_TRAFFIC_TREND_REFERRAL_KEY}
              enableBufferLine={markIncompleteTail}
              strokeVariant="solid"
              strokeWidth={TRAFFIC_TREND_STROKE_WIDTH}
              variant="gradient"
              visible={anyVisible}
            >
              <EChartsAreaChart.ActiveDot variant="border" />
            </EChartsAreaChart.Area>
            <EChartsAreaChart.Tooltip
              hideZeros
              layout="bars"
              position="fixed"
              rowGroups={tooltipGroups}
              valueFormatter={formatChartInteger}
              variant="duotone"
            />
          </EChartsAreaChart>
          <TrafficProviderLegend
            config={config}
            hiddenKeys={hiddenKeys}
            onToggle={(key) =>
              setHiddenKeys((current) => toggleTrafficTrendKey(current, key))
            }
            series={providerSeries}
          />
        </div>
      ) : null}
    </div>
  );
}
