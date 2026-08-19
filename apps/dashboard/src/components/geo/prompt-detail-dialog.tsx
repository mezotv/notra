"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { EngineIcon } from "@/components/geo/engine-icon";
import { PresenceBadge } from "@/components/geo/presence-badge";
import { cn } from "@/lib/utils";
import type { GeoPromptResult, PromptDetailDialogProps } from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import {
  formatEngineFamily,
  formatEngineWithMode,
  sharedEngineAnswerMode,
} from "@/utils/geo-charts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

function mentionStatus(result: GeoPromptResult): string {
  if (!result.mentioned) {
    return "Not mentioned";
  }
  if (result.position !== null) {
    return `#${result.position}`;
  }
  return "Mentioned";
}

function sentimentLabel(sentiment: string | null): string | null {
  if (!sentiment) {
    return null;
  }
  return SENTIMENT_LABELS[sentiment] ?? null;
}

function EngineResult({
  result,
  label,
}: {
  result: GeoPromptResult;
  label: string;
}) {
  const sentiment = sentimentLabel(result.sentiment);
  const excerpt = result.excerpt.trim();

  return (
    <article className="space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-5 shrink-0 items-center justify-center overflow-visible">
            <EngineIcon className="size-5" engine={result.engine} />
          </span>
          <p className="truncate font-medium text-sm leading-snug">{label}</p>
        </div>
        <p className="shrink-0 text-muted-foreground text-xs leading-snug">
          <span
            className={cn(
              result.mentioned && result.position !== null && "tabular-nums"
            )}
          >
            {mentionStatus(result)}
          </span>
          {result.mentioned && sentiment ? (
            <span
              className={cn(
                result.sentiment === "positive" &&
                  "text-emerald-600 dark:text-emerald-400",
                result.sentiment === "negative" &&
                  "text-rose-600 dark:text-rose-400"
              )}
            >
              {` · ${sentiment}`}
            </span>
          ) : null}
        </p>
      </div>
      {excerpt.length > 0 ? (
        <blockquote className="text-pretty border-border border-l-2 pl-3 text-sm leading-relaxed">
          {excerpt}
        </blockquote>
      ) : (
        <p className="text-muted-foreground text-sm">
          {result.mentioned
            ? "Mentioned, but no excerpt was captured."
            : "This engine did not mention you."}
        </p>
      )}
    </article>
  );
}

export function PromptDetailDialog({
  open,
  onOpenChange,
  row,
  isScanning = false,
}: PromptDetailDialogProps) {
  if (!row) {
    return null;
  }

  const answerMode = sharedEngineAnswerMode(
    row.results.map((result) => result.engine)
  );
  const latestCheck = row.results.reduce<string | null>((latest, result) => {
    if (!latest || result.lastCheckedAt > latest) {
      return result.lastCheckedAt;
    }
    return latest;
  }, null);

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-balance font-semibold text-xl">
            {row.prompt}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {answerMode
              ? `Latest ${answerMode} answer from each engine`
              : "Latest answer from each engine"}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="max-h-[70svh] space-y-4 overflow-y-auto px-4 md:px-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <PresenceBadge status={row.presence} />
            {row.total > 0 ? (
              <span className="text-muted-foreground text-sm">
                {row.mentioned}/{row.total} engines
                {row.bestPosition !== null
                  ? ` · best #${row.bestPosition}`
                  : ""}
                {latestCheck
                  ? ` · ${formatAiTrafficTimestamp(latestCheck)}`
                  : ""}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">
                {geoScanEmptyMessage(
                  isScanning,
                  "Run a scan to see how engines answer this"
                )}
              </span>
            )}
          </div>
          {row.results.length > 0 ? (
            <div className="space-y-4">
              {row.results.map((result) => (
                <EngineResult
                  key={`${row.id}:${result.engine}`}
                  label={
                    answerMode
                      ? formatEngineFamily(result.engine)
                      : formatEngineWithMode(result.engine)
                  }
                  result={result}
                />
              ))}
            </div>
          ) : null}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
