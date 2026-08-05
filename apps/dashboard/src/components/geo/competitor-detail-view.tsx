"use client";

import {
  ArrowUpRight01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo, useState } from "react";
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";
import { CompetitorEditDialog } from "@/components/geo/competitor-edit-dialog";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { EngineIcon } from "@/components/geo/engine-icon";
import { Table, type TableColumn } from "@/components/motion/table";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { CHART_PRIMARY_COLOR } from "@/constants/charts";
import {
  COMPETITOR_PROMPTS_PAGE_TABLE_HEIGHT,
  COMPETITOR_PROMPTS_TABLE_HEIGHT,
  COMPETITORS_TABLE_ROW_HEIGHT,
  GEO_COMPETITOR_DETAIL_MIN_POINTS,
  GEO_COMPETITOR_DETAIL_SERIES_KEY,
  GEO_ENGINE_LABELS,
} from "@/constants/geo";
import { useGeoCompetitorDetail, useGeoCompetitors } from "@/lib/hooks/use-geo";
import type {
  CompetitorDetailViewProps,
  GeoCompetitorPromptRow,
} from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import { seriesColors } from "@/utils/chart-colors";
import { buildGeoCompetitorPoints } from "@/utils/geo-competitor";

const CHART_CONFIG: ChartConfig = {
  [GEO_COMPETITOR_DETAIL_SERIES_KEY]: {
    label: "Mentions",
    colors: seriesColors(CHART_PRIMARY_COLOR),
  },
};

export function CompetitorDetailView({
  organizationSlug,
  competitor,
  variant = "modal",
}: CompetitorDetailViewProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: competitorList } = useGeoCompetitors(organizationId);
  const entry =
    competitorList?.competitors.find(
      (item) => item.name.toLowerCase() === competitor.toLowerCase()
    ) ?? null;
  const domain = entry?.domain ?? null;
  const [editOpen, setEditOpen] = useState(false);
  const { data, isLoading } = useGeoCompetitorDetail(
    organizationId,
    competitor
  );
  const points = useMemo(
    () => buildGeoCompetitorPoints(data?.points ?? []),
    [data]
  );
  const prompts = useMemo(() => data?.prompts ?? [], [data]);

  const columns = useMemo<TableColumn<GeoCompetitorPromptRow>[]>(
    () => [
      {
        key: "prompt",
        header: "Prompt",
        width: "2.6fr",
        sortable: true,
        cell: (row) => (
          <Tooltip>
            <TooltipTrigger
              render={<span className="block truncate">{row.prompt}</span>}
            />
            <TooltipContent className="max-w-sm">{row.prompt}</TooltipContent>
          </Tooltip>
        ),
      },
      {
        key: "engine",
        header: "Engine",
        width: "1.2fr",
        sortable: true,
        cell: (row) => (
          <span className="inline-flex min-w-0 items-center gap-2">
            <EngineIcon className="size-4 shrink-0" engine={row.engine} />
            <span className="truncate">
              {GEO_ENGINE_LABELS[row.engine] ?? row.engine}
            </span>
          </span>
        ),
      },
      {
        key: "position",
        header: "Our position",
        width: "8rem",
        align: "right",
        cell: (row) => (
          <span className="tabular-nums">
            {row.mentioned ? (row.position ?? "Mentioned") : "Absent"}
          </span>
        ),
        sortValue: (row) => row.position ?? Number.MAX_SAFE_INTEGER,
      },
      {
        key: "capturedAt",
        header: "Last seen",
        width: "9rem",
        sortable: true,
        cell: (row) => (
          <span className="text-muted-foreground text-xs tabular-nums">
            {formatAiTrafficTimestamp(row.capturedAt)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <CompetitorLogo
            className="size-10"
            domain={domain}
            name={competitor}
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-semibold text-lg">{competitor}</p>
            {domain ? (
              <a
                className="group inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
                href={`https://${domain}`}
                rel="noopener"
                target="_blank"
              >
                <span className="underline underline-offset-4">{domain}</span>
                <HugeiconsIcon
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  icon={ArrowUpRight01Icon}
                  size={12}
                />
              </a>
            ) : (
              <span className="text-muted-foreground text-xs">
                No website yet
              </span>
            )}
          </div>
        </div>
        {entry ? (
          <Button onClick={() => setEditOpen(true)} size="sm" variant="outline">
            <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
            Edit
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-base">Mentions over time</h2>
        {isLoading && <Skeleton className="h-52 w-full" />}
        {!isLoading && points.length >= GEO_COMPETITOR_DETAIL_MIN_POINTS && (
          <EChartsAreaChart
            className="h-52 w-full"
            config={CHART_CONFIG}
            curveType="monotone"
            data={points}
            enableHoverHighlight
            xDataKey="day"
          >
            <EChartsAreaChart.Grid />
            <EChartsAreaChart.XAxis dataKey="day" />
            <EChartsAreaChart.YAxis />
            <EChartsAreaChart.Area
              dataKey={GEO_COMPETITOR_DETAIL_SERIES_KEY}
              variant="gradient"
            />
            <EChartsAreaChart.Tooltip crosshair />
          </EChartsAreaChart>
        )}
        {!isLoading && points.length < GEO_COMPETITOR_DETAIL_MIN_POINTS && (
          <p className="text-muted-foreground text-sm">
            Not enough scans yet to chart {competitor}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-base">
            Where {competitor} shows up
          </h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {prompts.length.toLocaleString()} results
          </span>
        </div>
        <Table
          className="rounded-2xl"
          columns={columns}
          data={prompts}
          defaultSort={{ key: "capturedAt", direction: "desc" }}
          emptyState={`${competitor} has not shown up in your tracked prompts yet`}
          getRowId={(row) => `${row.promptId}-${row.engine}`}
          height={
            variant === "page"
              ? COMPETITOR_PROMPTS_PAGE_TABLE_HEIGHT
              : COMPETITOR_PROMPTS_TABLE_HEIGHT
          }
          loading={isLoading}
          resizable
          rowHeight={COMPETITORS_TABLE_ROW_HEIGHT}
        />
      </div>
      {entry ? (
        <CompetitorEditDialog
          competitor={entry}
          onOpenChange={setEditOpen}
          open={editOpen}
          organizationId={organizationId}
        />
      ) : null}
    </div>
  );
}
