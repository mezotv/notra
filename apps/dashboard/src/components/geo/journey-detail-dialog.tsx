"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { useMemo } from "react";
import { EChartsLineChart } from "@/components/evilcharts/charts/echarts-line-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";
import { EngineIcon } from "@/components/geo/engine-icon";
import { CHART_PRIMARY_COLOR } from "@/constants/charts";
import {
  GEO_JOURNEY_DETAIL_MIN_EVENTS,
  GEO_JOURNEY_DETAIL_SERIES_KEY,
} from "@/constants/geo";
import { useGeoJourneyDetail } from "@/lib/hooks/use-geo";
import type { JourneyDetailDialogProps } from "@/types/geo";
import { formatGeoJourneySpan, formatGeoSource } from "@/utils/ai-traffic";
import { seriesColors } from "@/utils/chart-colors";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import {
  buildGeoJourneyPoints,
  formatGeoJourneyClock,
  formatGeoRefererSource,
  hasGeoJourneyReferers,
} from "@/utils/geo-journey";

const CHART_CONFIG: ChartConfig = {
  [GEO_JOURNEY_DETAIL_SERIES_KEY]: {
    label: "Pages fetched",
    colors: seriesColors(CHART_PRIMARY_COLOR),
  },
};

export function JourneyDetailDialog({
  open,
  onOpenChange,
  organizationId,
  journey,
}: JourneyDetailDialogProps) {
  const { data, isLoading } = useGeoJourneyDetail(
    organizationId,
    open ? (journey?.journeyId ?? null) : null
  );

  const events = useMemo(() => data?.events ?? [], [data]);
  const points = useMemo(() => buildGeoJourneyPoints(events), [events]);
  const showReferer = useMemo(() => hasGeoJourneyReferers(events), [events]);

  if (!journey) {
    return null;
  }

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-3xl [&>*]:min-w-0">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Agent journey</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            How this agent moved through your site, one fetch at a time.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4 px-4 md:px-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-muted-foreground text-xs">
              {journey.journeyId}
            </span>
            <Button
              aria-label="Copy journey id"
              onClick={() => copyToClipboard(journey.journeyId)}
              size="icon"
              variant="ghost"
            >
              <HugeiconsIcon className="size-4" icon={Copy01Icon} />
            </Button>
            <span className="inline-flex items-center gap-2 text-sm">
              <EngineIcon engine={journey.source} />
              {formatGeoSource(journey.source, journey.visitorType)}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground text-xs">Visitor</dt>
              <dd className="text-sm">
                {journey.visitorType === "crawler" ? "Crawler" : "AI referral"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Span</dt>
              <dd className="text-sm tabular-nums">
                {formatGeoJourneySpan(journey.firstSeenAt, journey.lastSeenAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Pages</dt>
              <dd className="text-sm tabular-nums">{journey.pages}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Unique paths</dt>
              <dd className="text-sm tabular-nums">{journey.distinctPaths}</dd>
            </div>
          </dl>
          {isLoading && <Skeleton className="h-64 w-full" />}
          {!isLoading && points.length >= GEO_JOURNEY_DETAIL_MIN_EVENTS && (
            <EChartsLineChart
              className="h-64 w-full"
              config={CHART_CONFIG}
              curveType="step"
              data={points}
              xDataKey="point"
            >
              <EChartsLineChart.Grid />
              <EChartsLineChart.XAxis
                dataKey="point"
                tickFormatter={(value) => value.split(" · ")[0] ?? ""}
              />
              <EChartsLineChart.YAxis />
              <EChartsLineChart.Line dataKey={GEO_JOURNEY_DETAIL_SERIES_KEY}>
                <EChartsLineChart.Dot variant="colored-border" />
                <EChartsLineChart.ActiveDot variant="colored-border" />
              </EChartsLineChart.Line>
              <EChartsLineChart.Tooltip />
            </EChartsLineChart>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Path</TableHead>
                  {showReferer && <TableHead>Referer</TableHead>}
                  <TableHead>Country</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={showReferer ? 4 : 3}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && events.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="text-muted-foreground text-sm"
                      colSpan={showReferer ? 4 : 3}
                    >
                      No events captured for this journey
                    </TableCell>
                  </TableRow>
                )}
                {events.map((event) => (
                  <TableRow key={`${event.capturedAt}-${event.path}`}>
                    <TableCell className="whitespace-nowrap text-[0.6875rem] text-muted-foreground tabular-nums">
                      {formatGeoJourneyClock(event.capturedAt)}
                    </TableCell>
                    <TableCell
                      className="max-w-[22rem] truncate font-mono text-xs"
                      title={event.path}
                    >
                      {event.path}
                    </TableCell>
                    {showReferer && (
                      <TableCell className="text-sm">
                        {formatGeoRefererSource(event.referer)}
                      </TableCell>
                    )}
                    <TableCell className="text-sm">{event.country}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
