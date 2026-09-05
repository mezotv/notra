"use client";

import {
  GEO_SEARCH_LABEL,
  GEO_WITHOUT_SEARCH_LABEL,
} from "@notra/geo-core/constants/geo";
import { GeoBar } from "@notra/ui/components/geo/geo-bar";
import { Badge } from "@notra/ui/components/ui/badge";
import { Card, CardContent } from "@notra/ui/components/ui/card";
import { useMemo } from "react";

import { Button } from "@/components/button";
import { EChartsLineChart } from "@/components/evilcharts/charts/echarts-line-chart";
import { DirectionDelta } from "@/components/geo/directions/direction-delta";
import { PromptResultsTable } from "@/components/geo/directions/prompt-results-table";
import { EngineIcon } from "@/components/geo/engine-icon";
import { InstrumentModule } from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { CHART_PERCENT_SCALE } from "@/constants/charts";
import {
  GEO_DIRECTIONS_ENGINES,
  GEO_DIRECTIONS_KPIS,
  GEO_DIRECTIONS_LAST_SCAN_LABEL,
  GEO_DIRECTIONS_NEXT_SCAN_LABEL,
  GEO_DIRECTIONS_SOURCES,
  GEO_DIRECTIONS_TREND_CONFIG,
  GEO_DIRECTIONS_TREND_ROWS,
  GEO_DIRECTIONS_VISIBILITY,
  GEO_DIRECTIONS_VISIBILITY_DELTA,
} from "@/constants/geo-directions";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { GeoDirectionSourceRow } from "@/types/geo-directions";
import { formatChartPercent, formatMentionRate } from "@/utils/geo-charts";
import { formatDirectionCount } from "@/utils/geo-directions";
import { tableHeightFor } from "@/utils/table";

const MAX_SHARE = 1;

function Rail() {
  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-64 lg:self-start">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-sm font-medium">
              AI visibility
            </p>
            <div className="flex items-end gap-2">
              <span className="text-primary text-4xl font-bold tabular-nums">
                {formatMentionRate(GEO_DIRECTIONS_VISIBILITY)}
              </span>
              <DirectionDelta
                className="mb-1"
                delta={GEO_DIRECTIONS_VISIBILITY_DELTA}
              />
            </div>
          </div>

          <div className="divide-border border-border divide-y border-t">
            {GEO_DIRECTIONS_ENGINES.map((engine) => (
              <div
                className="flex items-center gap-2 py-2 text-sm"
                key={engine.engine}
              >
                <EngineIcon engine={engine.engine} />
                <span className="text-muted-foreground min-w-0 flex-1 truncate">
                  {engine.label}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatMentionRate(engine.rate)}
                </span>
              </div>
            ))}
          </div>

          <Button className="w-full" size="sm">
            Run scan
          </Button>
          <p className="text-muted-foreground text-xs">
            Last scan {GEO_DIRECTIONS_LAST_SCAN_LABEL} · next auto scan in{" "}
            {GEO_DIRECTIONS_NEXT_SCAN_LABEL}
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}

function KpiStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {GEO_DIRECTIONS_KPIS.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="flex flex-1 flex-col justify-center gap-2">
            <p className="text-muted-foreground text-sm font-medium">
              {kpi.label}
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {formatDirectionCount(kpi.value)}
            </p>
            <p className="text-muted-foreground text-xs">{kpi.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SourcesTable() {
  const columns = useMemo<TableColumn<GeoDirectionSourceRow>[]>(
    () => [
      {
        key: "label",
        header: "Source",
        width: "1fr",
        sortable: true,
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <EngineIcon engine={row.source} />
            <span className="truncate">{row.label}</span>
          </span>
        ),
      },
      {
        key: "kind",
        header: "Type",
        width: "7rem",
        sortable: true,
        cell: (row) => (
          <Badge className="rounded-sm capitalize" variant="outline">
            {row.kind}
          </Badge>
        ),
      },
      {
        key: "visits",
        header: "Visits",
        width: "6.5rem",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">
            {formatDirectionCount(row.visits)}
          </span>
        ),
      },
      {
        key: "share",
        header: "Share",
        width: "6rem",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">
            {formatMentionRate(row.share)}
          </span>
        ),
      },
      {
        key: "weight",
        header: "Weight",
        width: "1.2fr",
        cell: (row) => <GeoBar max={MAX_SHARE} value={row.share} />,
        sortValue: (row) => row.share,
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground flex items-center justify-between px-1 text-xs">
        <span>{GEO_DIRECTIONS_SOURCES.length.toLocaleString()} sources</span>
      </div>
      <Table
        className="rounded-2xl"
        columns={columns}
        data={[...GEO_DIRECTIONS_SOURCES]}
        defaultSort={{ key: "visits", direction: "desc" }}
        emptyState="No AI traffic captured yet"
        getRowId={(row) => row.source}
        height={tableHeightFor(GEO_DIRECTIONS_SOURCES.length)}
        resizable
        rowHeight={TABLE_ROW_HEIGHT}
      />
    </div>
  );
}

export function DirectionCockpit() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Rail />
      <div className="min-w-0 flex-1 space-y-3">
        <KpiStrip />
        <InstrumentModule
          eyebrow="Mention rate trend"
          readout={`${GEO_SEARCH_LABEL} vs ${GEO_WITHOUT_SEARCH_LABEL}`}
        >
          <EChartsLineChart
            animation={false}
            className="h-64 w-full"
            config={GEO_DIRECTIONS_TREND_CONFIG}
            curveType="monotone"
            data={GEO_DIRECTIONS_TREND_ROWS}
            enableHoverHighlight
            xDataKey="day"
          >
            <EChartsLineChart.Grid />
            <EChartsLineChart.XAxis dataKey="day" />
            <EChartsLineChart.YAxis tickFormatter={formatChartPercent} />
            <EChartsLineChart.Line dataKey="grounded" />
            <EChartsLineChart.Line dataKey="training" />
            <EChartsLineChart.Tooltip
              barMax={CHART_PERCENT_SCALE}
              layout="bars"
              valueFormatter={formatChartPercent}
            />
          </EChartsLineChart>
        </InstrumentModule>
        <InstrumentModule eyebrow="Traffic by source">
          <SourcesTable />
        </InstrumentModule>
        <InstrumentModule
          eyebrow="Prompt results"
          readout="position per engine"
        >
          <PromptResultsTable />
        </InstrumentModule>
      </div>
    </div>
  );
}
