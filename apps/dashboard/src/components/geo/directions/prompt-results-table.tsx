"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  GEO_DIRECTIONS_POSITION_CLASS,
  GEO_DIRECTIONS_PROMPT_ENGINES,
  GEO_DIRECTIONS_PROMPTS,
} from "@/constants/geo-directions";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { cn } from "@/lib/utils";
import type {
  DirectionPositionCellProps,
  GeoDirectionPrompt,
  PromptResultsTableProps,
} from "@/types/geo-directions";
import { directionPositionTone } from "@/utils/geo-directions";
import { tableHeightFor } from "@/utils/table";

function PositionCell({ position }: DirectionPositionCellProps) {
  if (position === null) {
    return <span className="text-muted-foreground text-xs">Not mentioned</span>;
  }

  return (
    <Badge
      className={cn(
        "rounded-sm tabular-nums",
        GEO_DIRECTIONS_POSITION_CLASS[directionPositionTone(position)]
      )}
      variant="outline"
    >
      #{position}
    </Badge>
  );
}

function positionFor(row: GeoDirectionPrompt, engine: string): number | null {
  return (
    row.positions.find((entry) => entry.engine === engine)?.position ?? null
  );
}

export function PromptResultsTable({ className }: PromptResultsTableProps) {
  const columns = useMemo<TableColumn<GeoDirectionPrompt>[]>(
    () => [
      {
        key: "prompt",
        header: "Prompt",
        width: "1fr",
        sortable: true,
        cell: (row) => (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="block w-full min-w-0 truncate text-sm">
                  {row.prompt}
                </span>
              }
            />
            <TooltipContent className="max-w-sm">{row.prompt}</TooltipContent>
          </Tooltip>
        ),
      },
      ...GEO_DIRECTIONS_PROMPT_ENGINES.map<TableColumn<GeoDirectionPrompt>>(
        (engine) => ({
          key: engine.engine,
          header: (
            <span className="inline-flex items-center gap-1.5">
              <EngineIcon engine={engine.engine} />
              {engine.label}
            </span>
          ),
          width: "8.5rem",
          align: "center",
          sortable: true,
          cell: (row) => (
            <PositionCell position={positionFor(row, engine.engine)} />
          ),
          sortValue: (row) =>
            positionFor(row, engine.engine) ?? Number.MAX_SAFE_INTEGER,
        })
      ),
    ],
    []
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
        <span>{GEO_DIRECTIONS_PROMPTS.length.toLocaleString()} prompts</span>
      </div>
      <Table
        className="rounded-2xl"
        columns={columns}
        data={[...GEO_DIRECTIONS_PROMPTS]}
        emptyState="No prompt results yet"
        getRowId={(row) => row.promptId}
        height={tableHeightFor(GEO_DIRECTIONS_PROMPTS.length)}
        resizable
        rowHeight={TABLE_ROW_HEIGHT}
      />
    </div>
  );
}
