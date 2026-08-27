"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";

import { EngineIcon } from "@/components/geo/engine-icon";
import { LogoStack } from "@/components/geo/logo-stack";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { GeoPromptSummary, PromptResultsPreviewProps } from "@/types/geo";
import { engineFamilyLabel } from "@/utils/geo-charts";
import {
  mentionedEngineFamilies,
  sortWinningPromptSummaries,
  summarizePromptResults,
} from "@/utils/geo-presence";
import { geoScanEmptyMessage } from "@/utils/geo-scan";
import { tableHeightFor } from "@/utils/table";

const DEFAULT_LIMIT = 6;

export function PromptResultsPreview({
  results,
  limit = DEFAULT_LIMIT,
  action,
  isScanning = false,
}: PromptResultsPreviewProps) {
  const rows = useMemo(() => {
    const summaries = summarizePromptResults(results);
    return sortWinningPromptSummaries(summaries).slice(0, limit);
  }, [results, limit]);

  const columns = useMemo<TableColumn<GeoPromptSummary>[]>(
    () => [
      {
        key: "prompt",
        header: "Prompt",
        width: "1fr",
        minWidth: "12rem",
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
      {
        key: "bestPosition",
        header: "Best",
        width: "4.5rem",
        align: "center",
        sortable: true,
        cell: (row) =>
          row.bestPosition === null ? (
            <span className="text-muted-foreground text-xs">-</span>
          ) : (
            <Badge className="rounded-sm tabular-nums" variant="outline">
              #{row.bestPosition}
            </Badge>
          ),
        sortValue: (row) => row.bestPosition ?? Number.MAX_SAFE_INTEGER,
      },
      {
        key: "engines",
        header: "Engines",
        width: "7rem",
        sortable: true,
        cell: (row) => (
          <LogoStack
            items={mentionedEngineFamilies(row).map((family) => ({
              key: family,
              label: engineFamilyLabel(family),
              renderIcon: (className) => (
                <EngineIcon className={className} engine={family} />
              ),
            }))}
          />
        ),
        sortValue: (row) => row.mentioned / row.total,
      },
    ],
    []
  );

  return (
    <InstrumentSection
      action={action}
      bodyClassName="flex min-h-0 flex-1 flex-col"
      className="h-full"
      eyebrow="Winning prompts"
    >
      {rows.length === 0 ? (
        <InstrumentEmpty
          busy={isScanning}
          className="min-h-48"
          message={geoScanEmptyMessage(
            isScanning,
            "Run a scan to see which prompts surface you"
          )}
          seed="Winning prompts"
        />
      ) : (
        <Table
          className="rounded-2xl"
          columns={columns}
          data={rows}
          defaultSort={{ direction: "asc", key: "bestPosition" }}
          emptyState={geoScanEmptyMessage(
            isScanning,
            "Run a scan to see which prompts surface you"
          )}
          getRowId={(row) => row.promptId}
          height={tableHeightFor(rows.length)}
          rowHeight={TABLE_ROW_HEIGHT}
        />
      )}
    </InstrumentSection>
  );
}
