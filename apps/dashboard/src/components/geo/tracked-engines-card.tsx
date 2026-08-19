"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { GeoTrackedEngine, TrackedEnginesCardProps } from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import { formatMentionRate } from "@/utils/geo-charts";
import {
  describeEngineStatus,
  formatEngineMode,
  formatEngineStatus,
  trackedEngineStatusTone,
} from "@/utils/geo-engines";
import { tableHeightFor } from "@/utils/table";

export function TrackedEnginesCard({ engines }: TrackedEnginesCardProps) {
  const activeCount = engines.filter(
    (engine) => engine.status === "active"
  ).length;

  const columns = useMemo<TableColumn<GeoTrackedEngine>[]>(
    () => [
      {
        key: "label",
        header: (
          <span className="inline-flex items-center gap-1.5">
            Engine
            <span className="font-normal text-muted-foreground tabular-nums">
              ({engines.length})
            </span>
          </span>
        ),
        width: "1.6fr",
        sortable: true,
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-2">
            <EngineIcon className="size-4 shrink-0" engine={row.key} />
            <span className="truncate font-medium">{row.label}</span>
          </span>
        ),
      },
      {
        key: "model",
        header: "Model",
        width: "1.6fr",
        cell: (row) => (
          <span className="truncate font-mono text-muted-foreground text-xs">
            {row.model}
          </span>
        ),
      },
      {
        key: "mode",
        header: "Answers from",
        width: "9.5rem",
        sortable: true,
        cell: (row) => (
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Badge
                    variant={row.mode === "grounded" ? "default" : "secondary"}
                  >
                    {formatEngineMode(row.mode)}
                  </Badge>
                }
              />
              <TooltipContent>
                {row.mode === "grounded"
                  ? "Looks up the live web before answering"
                  : "Answers from what the model already knows"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "8rem",
        sortable: true,
        cell: (row) => (
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className={trackedEngineStatusTone(row.status)}>
                    {formatEngineStatus(row.status)}
                  </span>
                }
              />
              <TooltipContent>{describeEngineStatus(row)}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
      {
        key: "mentionRate",
        header: "Mention rate",
        width: "9.5rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="tabular-nums">
            {row.mentionRate === null
              ? "-"
              : formatMentionRate(row.mentionRate)}
          </span>
        ),
        sortValue: (row) => row.mentionRate ?? -1,
      },
      {
        key: "lastCheckedAt",
        header: "Last checked",
        width: "9.5rem",
        sortable: true,
        cell: (row) => (
          <span className="text-muted-foreground text-xs tabular-nums">
            {row.lastCheckedAt
              ? formatAiTrafficTimestamp(row.lastCheckedAt)
              : "-"}
          </span>
        ),
      },
    ],
    [engines.length]
  );

  return (
    <InstrumentSection
      eyebrow="Tracked engines"
      readout={`${activeCount} of ${engines.length} scanning`}
    >
      {engines.length === 0 ? (
        <InstrumentEmpty
          message="No engines configured yet"
          seed="geo-engines"
        />
      ) : (
        <Table
          className="rounded-2xl"
          columns={columns}
          data={engines}
          defaultSort={{ key: "mode", direction: "asc" }}
          emptyState="No engines configured yet"
          getRowId={(row) => row.key}
          height={tableHeightFor(engines.length)}
          resizable
          rowHeight={TABLE_ROW_HEIGHT}
        />
      )}
    </InstrumentSection>
  );
}
