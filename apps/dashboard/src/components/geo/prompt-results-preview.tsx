"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";
import { PresenceBadge } from "@/components/geo/presence-badge";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { GEO_LANGUAGE_FLAGS } from "@/constants/geo";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { GeoPromptSummary, PromptResultsPreviewProps } from "@/types/geo";
import { summarizePromptResults } from "@/utils/geo-presence";
import { tableHeightFor } from "@/utils/table";

const DEFAULT_LIMIT = 3;

export function PromptResultsPreview({
  results,
  limit = DEFAULT_LIMIT,
  action,
  languages = [],
}: PromptResultsPreviewProps) {
  const summaries = useMemo(() => summarizePromptResults(results), [results]);
  const rows = useMemo(() => summaries.slice(0, limit), [summaries, limit]);

  const columns = useMemo<TableColumn<GeoPromptSummary>[]>(() => {
    const base: TableColumn<GeoPromptSummary>[] = [
      {
        key: "prompt",
        header: "Prompt",
        width: "2.4fr",
        sortable: true,
        cell: (row) => (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="block truncate text-sm">{row.prompt}</span>
              }
            />
            <TooltipContent className="max-w-sm">{row.prompt}</TooltipContent>
          </Tooltip>
        ),
      },
    ];

    if (languages.length > 0) {
      base.push({
        key: "languages",
        header: "Languages",
        width: "7.5rem",
        cell: () => (
          <span className="flex items-center gap-0.5 text-xs">
            {languages.map((language) => (
              <span key={language} title={`Also scanned in ${language}`}>
                {GEO_LANGUAGE_FLAGS[language]}
              </span>
            ))}
          </span>
        ),
      });
    }

    base.push(
      {
        key: "presence",
        header: "Presence",
        width: "9.375rem",
        sortable: true,
        cell: (row) => <PresenceBadge status={row.presence} />,
        sortValue: (row) => row.presence ?? "",
      },
      {
        key: "bestPosition",
        header: "Best position",
        width: "8.125rem",
        align: "right",
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
        width: "6.875rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-muted-foreground text-xs tabular-nums">
            {row.mentioned}/{row.total}
          </span>
        ),
        sortValue: (row) => row.mentioned / row.total,
      }
    );

    return base;
  }, [languages]);

  return (
    <InstrumentSection
      action={action}
      eyebrow="Winning prompts"
      readout="best surfacing first"
    >
      {rows.length === 0 ? (
        <InstrumentEmpty
          className="h-24"
          message="Run a scan to see which prompts surface you"
          seed="Winning prompts"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
            <span>{rows.length.toLocaleString()} prompts</span>
            <span>{summaries.length.toLocaleString()} tracked</span>
          </div>
          <Table
            className="rounded-2xl"
            columns={columns}
            data={rows}
            emptyState="Run a scan to see which prompts surface you"
            getRowId={(row) => row.promptId}
            height={tableHeightFor(rows.length)}
            resizable
            rowHeight={TABLE_ROW_HEIGHT}
          />
        </div>
      )}
    </InstrumentSection>
  );
}
