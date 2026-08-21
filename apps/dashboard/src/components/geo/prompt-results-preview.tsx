"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";
import { PresenceBadge } from "@/components/geo/presence-badge";
import { Twemoji } from "@/components/geo/twemoji";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { GEO_LANGUAGE_FLAGS } from "@/constants/geo";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { GeoPromptSummary, PromptResultsPreviewProps } from "@/types/geo";
import { summarizePromptResults } from "@/utils/geo-presence";
import { geoScanEmptyMessage } from "@/utils/geo-scan";
import { tableHeightFor } from "@/utils/table";

const DEFAULT_LIMIT = 3;

const NO_LANGUAGES: string[] = [];

export function PromptResultsPreview({
  results,
  limit = DEFAULT_LIMIT,
  action,
  languages = NO_LANGUAGES,
  isScanning = false,
}: PromptResultsPreviewProps) {
  const summaries = useMemo(() => summarizePromptResults(results), [results]);
  const rows = useMemo(() => summaries.slice(0, limit), [summaries, limit]);

  const columns = useMemo<TableColumn<GeoPromptSummary>[]>(() => {
    const base: TableColumn<GeoPromptSummary>[] = [
      {
        key: "prompt",
        header: "Prompt",
        width: "1fr",
        minWidth: "10rem",
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
    ];

    base.push(
      {
        key: "presence",
        header: "Presence",
        width: "7rem",
        sortable: true,
        cell: (row) =>
          row.presence === "retrieval-only" || row.presence === "invisible" ? (
            <PresenceBadge status={row.presence} />
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
        sortValue: (row) => row.presence ?? "",
      },
      {
        key: "bestPosition",
        header: "Best",
        width: "5rem",
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
        width: "5.5rem",
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
  }, []);

  return (
    <InstrumentSection
      action={action}
      className="h-full"
      eyebrow="Winning prompts"
      readout="best surfacing first"
    >
      {rows.length === 0 ? (
        <InstrumentEmpty
          busy={isScanning}
          className="h-24"
          message={geoScanEmptyMessage(
            isScanning,
            "Run a scan to see which prompts surface you"
          )}
          seed="Winning prompts"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex min-h-5 items-center justify-between gap-3 px-1 text-muted-foreground text-xs">
            <span>{rows.length.toLocaleString()} prompts</span>
            <div className="flex min-w-0 items-center gap-3">
              {languages.length > 0 ? (
                <span className="flex shrink-0 items-center gap-1">
                  {languages.map((language) => (
                    <Twemoji
                      className="size-3.5 shrink-0"
                      emoji={GEO_LANGUAGE_FLAGS[language] ?? ""}
                      key={language}
                      label={language}
                    />
                  ))}
                </span>
              ) : null}
              <span className="shrink-0 tabular-nums">
                {summaries.length.toLocaleString()} tracked
              </span>
            </div>
          </div>
          <Table
            className="rounded-2xl"
            columns={columns}
            data={rows}
            emptyState={geoScanEmptyMessage(
              isScanning,
              "Run a scan to see which prompts surface you"
            )}
            getRowId={(row) => row.promptId}
            height={tableHeightFor(rows.length)}
            rowHeight={TABLE_ROW_HEIGHT}
          />
        </div>
      )}
    </InstrumentSection>
  );
}
