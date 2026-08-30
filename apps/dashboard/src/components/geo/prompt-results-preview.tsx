"use client";

import { SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GEO_PROMPT_NO_MENTION,
  GEO_PROMPT_PREVIEW_ROW_HEIGHT,
  GEO_SENTIMENT_LABELS,
} from "@notra/geo-core/constants/geo";
import type { GeoPromptSummary } from "@notra/geo-core/types/geo";
import { engineFamilyLabel } from "@notra/geo-core/utils/geo-engine-family";
import {
  mentionedEngineFamilies,
  summarizePromptResults,
} from "@notra/geo-core/utils/geo-presence";
import { geoScanEmptyMessage } from "@notra/geo-core/utils/geo-scan";
import { Badge } from "@notra/ui/components/ui/badge";
import { Input } from "@notra/ui/components/ui/input";
import { useMemo, useState } from "react";

import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoBar } from "@/components/geo/geo-bar";
import { LogoStack } from "@/components/geo/logo-stack";
import { PresenceBadge } from "@/components/geo/presence-badge";
import { PromptDetailDialog } from "@/components/geo/prompt-detail-dialog";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import type {
  PromptResultsPreviewProps,
  PromptSentimentLabelProps,
} from "@/types/geo";
import { fuzzyMatches } from "@/utils/fuzzy";
import { bestMentionedResult, promptTableRowForId } from "@/utils/geo-prompts";
import { tableHeightFor } from "@/utils/table";

const EMPTY_PROMPTS = "Run a scan to see how engines answer your prompts";
const SENTIMENT_SORT: Record<string, number> = {
  positive: 3,
  neutral: 2,
  negative: 1,
};

function PromptRateCell({
  mentioned,
  total,
}: {
  mentioned: number;
  total: number;
}) {
  if (total === 0) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <span className="flex items-center gap-2">
      <GeoBar className="w-16 shrink-0" value={mentioned / total} />
      <span className="text-muted-foreground text-xs tabular-nums">
        {mentioned}/{total}
      </span>
    </span>
  );
}

function PromptSentimentLabel({ sentiment }: PromptSentimentLabelProps) {
  if (!sentiment) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }
  const label = GEO_SENTIMENT_LABELS[sentiment];
  if (!label) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }
  return (
    <span
      className={
        sentiment === "positive"
          ? "text-geo-up text-xs"
          : sentiment === "negative"
            ? "text-geo-down text-xs"
            : "text-muted-foreground text-xs"
      }
    >
      {label}
    </span>
  );
}

function PromptCopyCell({ row }: { row: GeoPromptSummary }) {
  const best = bestMentionedResult(row.results);
  const excerpt = best?.excerpt.trim() ?? "";

  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="flex min-w-0 items-center gap-1.5">
        <TruncateWithTooltip className="text-sm font-medium">
          {row.prompt}
        </TruncateWithTooltip>
        <PresenceBadge status={row.presence} />
      </span>
      <span className="text-muted-foreground truncate text-xs">
        {excerpt || GEO_PROMPT_NO_MENTION}
      </span>
    </span>
  );
}

export function PromptResultsPreview({
  results,
  limit,
  action,
  isScanning = false,
}: PromptResultsPreviewProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const summaries = summarizePromptResults(results);
    const needle = query.trim();
    const matched =
      needle.length === 0
        ? summaries
        : summaries.filter((row) => fuzzyMatches([row.prompt], needle));
    return limit ? matched.slice(0, limit) : matched;
  }, [results, query, limit]);
  const detailRow = detailId ? promptTableRowForId(detailId, results) : null;

  const columns = useMemo<TableColumn<GeoPromptSummary>[]>(
    () => [
      {
        key: "prompt",
        header: "Prompt",
        width: "1.6fr",
        minWidth: "18rem",
        sortable: true,
        cell: (row) => <PromptCopyCell row={row} />,
      },
      {
        key: "sentiment",
        header: "Tone",
        width: "6.5rem",
        sortable: true,
        cell: (row) => (
          <PromptSentimentLabel
            sentiment={bestMentionedResult(row.results)?.sentiment ?? null}
          />
        ),
        sortValue: (row) =>
          SENTIMENT_SORT[bestMentionedResult(row.results)?.sentiment ?? ""] ??
          0,
      },
      {
        key: "rate",
        header: "Mentioned",
        width: "8.5rem",
        sortable: true,
        cell: (row) => (
          <PromptRateCell mentioned={row.mentioned} total={row.total} />
        ),
        sortValue: (row) => (row.total === 0 ? -1 : row.mentioned / row.total),
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
        width: "7.5rem",
        sortable: true,
        cell: (row) => {
          const families = mentionedEngineFamilies(row);
          if (families.length === 0) {
            return <span className="text-muted-foreground text-xs">-</span>;
          }
          return (
            <LogoStack
              items={families.map((family) => ({
                key: family,
                label: engineFamilyLabel(family),
                renderIcon: (className) => (
                  <EngineIcon className={className} engine={family} />
                ),
              }))}
            />
          );
        },
        sortValue: (row) => mentionedEngineFamilies(row).length,
      },
    ],
    []
  );

  return (
    <>
      <InstrumentSection
        action={
          results.length > 0 ? (
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative w-full sm:w-56">
                <HugeiconsIcon
                  className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2"
                  icon={SearchIcon}
                  size={14}
                />
                <Input
                  aria-label="Filter prompts"
                  className="h-7 pr-2.5 pl-8 text-xs"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter prompts..."
                  value={query}
                />
              </div>
              {action}
            </div>
          ) : (
            action
          )
        }
        bodyClassName="flex min-h-0 flex-1 flex-col"
        className="h-full"
        eyebrow="Prompts"
      >
        {results.length === 0 ? (
          <InstrumentEmpty
            busy={isScanning}
            className="min-h-48"
            message={geoScanEmptyMessage(isScanning, EMPTY_PROMPTS)}
            seed="Prompts"
          />
        ) : (
          <Table
            className="rounded-2xl"
            columns={columns}
            data={rows}
            defaultSort={{ direction: "desc", key: "rate" }}
            emptyState="No prompts match this filter"
            getRowId={(row) => row.promptId}
            height={tableHeightFor(rows.length, GEO_PROMPT_PREVIEW_ROW_HEIGHT)}
            onRowClick={(row) => setDetailId(row.promptId)}
            rowHeight={GEO_PROMPT_PREVIEW_ROW_HEIGHT}
          />
        )}
      </InstrumentSection>
      <PromptDetailDialog
        isScanning={isScanning}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null);
          }
        }}
        open={detailRow !== null}
        row={detailRow}
      />
    </>
  );
}
