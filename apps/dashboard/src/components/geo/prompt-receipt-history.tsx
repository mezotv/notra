"use client";

import {
  GEO_PROMPT_HISTORY_SKELETON_ROWS,
  GEO_PROMPT_RECEIPT_LABELS,
} from "@notra/geo-core/constants/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";
import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { cn } from "@/lib/utils";
import type {
  PromptHistoryChange,
  PromptReceiptHistoryProps,
} from "@/types/geo";
import {
  promptOutcomeLabel,
  promptPositionLabel,
  truncateScanId,
} from "@/utils/geo-prompt-history";

const SKELETON_KEYS = Array.from(
  { length: GEO_PROMPT_HISTORY_SKELETON_ROWS },
  (_, index) => `history-skeleton-${index}`
);

function changeToneClass(kind: PromptHistoryChange["kind"]): string {
  if (kind === "gained") {
    return "text-geo-up";
  }
  if (kind === "lost") {
    return "text-geo-down";
  }
  return "text-muted-foreground";
}

function HistorySkeleton() {
  return (
    <ul aria-busy="true" className="flex flex-col divide-y">
      {SKELETON_KEYS.map((key) => (
        <li className="flex items-center gap-3 py-2.5" key={key}>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </li>
      ))}
    </ul>
  );
}

export function PromptReceiptHistory({
  entries,
  isLoading,
}: PromptReceiptHistoryProps) {
  if (isLoading) {
    return <HistorySkeleton />;
  }
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {GEO_PROMPT_RECEIPT_LABELS.noHistory}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col divide-y">
        {entries.map(({ check, changes }) => (
          <li
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 text-sm"
            key={check.id}
          >
            <time
              className="text-muted-foreground w-40 shrink-0 tabular-nums"
              dateTime={check.capturedAt}
            >
              {formatAiTrafficTimestamp(check.capturedAt)}
            </time>
            <span
              className={cn(
                "w-28 shrink-0 font-medium",
                check.mentioned ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {promptOutcomeLabel(check.mentioned)}
            </span>
            <span className="text-muted-foreground w-20 shrink-0 tabular-nums">
              {promptPositionLabel(check.position)}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-0.5 text-xs">
              {changes.map((change) => (
                <span
                  className={changeToneClass(change.kind)}
                  key={`${check.id}-${change.kind}`}
                >
                  {change.label}
                </span>
              ))}
            </span>
            <span
              className="text-muted-foreground shrink-0 font-mono text-xs"
              title={check.scanId}
            >
              {truncateScanId(check.scanId)}
            </span>
          </li>
        ))}
      </ol>
      {entries.length === 1 ? (
        <p className="text-muted-foreground text-xs">
          {GEO_PROMPT_RECEIPT_LABELS.singleScan}
        </p>
      ) : null}
    </div>
  );
}
