"use client";

import { SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GEO_FAMILY_IMPROVE_CTA_GAPS,
  GEO_SENTIMENT_LABELS,
} from "@notra/geo-core/constants/geo";
import type { GeoPromptSummary } from "@notra/geo-core/types/geo";
import { engineFamilyLabel } from "@notra/geo-core/utils/geo-engine-family";
import {
  mentionedEngineFamilies,
  scannedEngineFamilies,
  summarizePromptResults,
  unseenPromptSummaries,
} from "@notra/geo-core/utils/geo-presence";
import { geoScanEmptyMessage } from "@notra/geo-core/utils/geo-scan";
import { GeoBar } from "@notra/ui/components/geo/geo-bar";
import { LogoStack } from "@notra/ui/components/geo/logo-stack";
import { PresenceBadge } from "@notra/ui/components/geo/presence-badge";
import { TruncateWithTooltip } from "@notra/ui/components/shared/truncate-with-tooltip";
import { Input } from "@notra/ui/components/ui/input";
import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/button";
import { EngineIcon } from "@/components/geo/engine-icon";
import { PromptDetailDialog } from "@/components/geo/prompt-detail-dialog";
import { InstrumentSection } from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { GEO_PROMPT_DETAIL_SURFACES } from "@/constants/geo-analytics";
import {
  GEO_LABEL_PILL_CLASS,
  GEO_SENTIMENT_ICONS,
  GEO_SENTIMENT_PILL_CLASS,
} from "@/constants/geo-prompts";
import { useAvailableTableHeight } from "@/lib/hooks/use-available-table-height";
import { cn } from "@/lib/utils";
import type {
  PromptResultsPreviewProps,
  PromptSentimentLabelProps,
} from "@/types/geo";
import { fuzzyMatches } from "@/utils/fuzzy";
import { bestMentionedResult, promptTableRowForId } from "@/utils/geo-prompts";
import { tableHeightFor } from "@/utils/table";

const EMPTY_PROMPTS = "Run a scan to see how engines answer your prompts";
const PREVIEW_ROW_HEIGHT = 48;
const UNSEEN_MAX_VISIBLE_ROWS = 5;
const UNSEEN_ENGINES_WIDTH = "7.5rem";
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

function isGeoSentiment(
  sentiment: string
): sentiment is keyof typeof GEO_SENTIMENT_ICONS {
  return sentiment in GEO_SENTIMENT_ICONS;
}

function PromptSentimentLabel({ sentiment }: PromptSentimentLabelProps) {
  if (!sentiment || !isGeoSentiment(sentiment)) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }
  const label = GEO_SENTIMENT_LABELS[sentiment];
  if (!label) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }
  return (
    <span
      className={cn(GEO_LABEL_PILL_CLASS, GEO_SENTIMENT_PILL_CLASS[sentiment])}
    >
      <HugeiconsIcon
        aria-hidden
        className="size-3.5 shrink-0"
        icon={GEO_SENTIMENT_ICONS[sentiment]}
        strokeWidth={2}
      />
      {label}
    </span>
  );
}

function PromptCopyCell({ row }: { row: GeoPromptSummary }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <TruncateWithTooltip className="font-medium">
        {row.prompt}
      </TruncateWithTooltip>
      <PresenceBadge status={row.presence} />
    </span>
  );
}

function PromptEngineLogos({ families }: { families: readonly string[] }) {
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
}

function unseenColumns(rowCount: number): TableColumn<GeoPromptSummary>[] {
  return [
    {
      key: "prompt",
      header: `Prompt (${rowCount.toLocaleString()})`,
      width: "1fr",
      minWidth: "18rem",
      sortable: true,
      cell: (row) => (
        <TruncateWithTooltip className="font-medium">
          {row.prompt}
        </TruncateWithTooltip>
      ),
      sortValue: (row) => row.prompt,
    },
    {
      key: "engines",
      header: "Engines",
      width: UNSEEN_ENGINES_WIDTH,
      sortable: true,
      cell: (row) => (
        <PromptEngineLogos families={scannedEngineFamilies(row)} />
      ),
      sortValue: (row) => scannedEngineFamilies(row).length,
    },
  ];
}

function previewColumns(): TableColumn<GeoPromptSummary>[] {
  return [
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
      width: "9rem",
      sortable: true,
      cell: (row) => (
        <PromptSentimentLabel
          sentiment={bestMentionedResult(row.results)?.sentiment ?? null}
        />
      ),
      sortValue: (row) =>
        SENTIMENT_SORT[bestMentionedResult(row.results)?.sentiment ?? ""] ?? 0,
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
          <span className="tabular-nums">#{row.bestPosition}</span>
        ),
      sortValue: (row) => row.bestPosition ?? Number.MAX_SAFE_INTEGER,
    },
    {
      key: "engines",
      header: "Engines",
      width: "7.5rem",
      sortable: true,
      cell: (row) => (
        <PromptEngineLogos families={mentionedEngineFamilies(row)} />
      ),
      sortValue: (row) => mentionedEngineFamilies(row).length,
    },
  ];
}

function visiblePromptSummaries(
  results: PromptResultsPreviewProps["results"],
  query: string,
  limit: number | undefined,
  unseen: boolean
) {
  const summaries = summarizePromptResults(results);
  if (unseen) {
    return unseenPromptSummaries(summaries);
  }
  const needle = query.trim();
  const matched =
    needle.length === 0
      ? summaries
      : summaries.filter((row) => fuzzyMatches([row.prompt], needle));
  return limit ? matched.slice(0, limit) : matched;
}

export function PromptResultsPreview({
  results,
  limit,
  isScanning = false,
  variant = "all",
  gapsHref,
}: PromptResultsPreviewProps) {
  const unseen = variant === "unseen";
  const [detailId, setDetailId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const rows = visiblePromptSummaries(results, query, limit, unseen);
  const detailRow = detailId ? promptTableRowForId(detailId, results) : null;
  const columns = unseen ? unseenColumns(rows.length) : previewColumns();
  const fallbackHeight = tableHeightFor(
    unseen
      ? Math.min(rows.length, UNSEEN_MAX_VISIBLE_ROWS)
      : Math.max(rows.length, 6),
    PREVIEW_ROW_HEIGHT
  );
  const [tableRef, fillHeight] = useAvailableTableHeight(fallbackHeight);
  const tableHeight = unseen
    ? tableHeightFor(
        Math.min(rows.length, UNSEEN_MAX_VISIBLE_ROWS),
        PREVIEW_ROW_HEIGHT
      )
    : fillHeight;

  if (unseen && rows.length === 0) {
    return null;
  }

  const table = (
    <Table
      className="rounded-2xl"
      columns={columns}
      data={rows}
      defaultSort={unseen ? null : { direction: "desc", key: "rate" }}
      emptyState={
        results.length === 0
          ? geoScanEmptyMessage(isScanning, EMPTY_PROMPTS)
          : "No prompts match this filter"
      }
      getRowId={(row) => row.promptId}
      height={tableHeight}
      loading={isScanning && results.length === 0}
      onRowClick={(row) => setDetailId(row.promptId)}
      resizable
      rowHeight={PREVIEW_ROW_HEIGHT}
      selectedRowIds={detailId ? [detailId] : undefined}
    />
  );

  const detailDialog = (
    <PromptDetailDialog
      isScanning={isScanning}
      onOpenChange={(open) => {
        if (!open) {
          setDetailId(null);
        }
      }}
      open={detailRow !== null}
      row={detailRow}
      surface={GEO_PROMPT_DETAIL_SURFACES.OVERVIEW}
    />
  );

  if (unseen) {
    return (
      <>
        <InstrumentSection
          action={
            gapsHref ? (
              <Link
                className={cn(buttonVariants({ size: "sm" }))}
                href={gapsHref}
              >
                {GEO_FAMILY_IMPROVE_CTA_GAPS}
              </Link>
            ) : undefined
          }
          className="shrink-0"
          description="Questions no engine named you on."
          eyebrow="Unseen"
        >
          {table}
        </InstrumentSection>
        {detailDialog}
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-36 min-w-0 shrink-0 grow basis-0 flex-col gap-3">
        <div className="flex justify-end">
          <div className="relative w-full min-w-0 sm:max-w-72">
            <HugeiconsIcon
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              icon={SearchIcon}
              size={15}
            />
            <Input
              aria-label="Filter prompts"
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter prompts..."
              value={query}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1" ref={tableRef}>
          {table}
        </div>
      </div>
      {detailDialog}
    </>
  );
}
