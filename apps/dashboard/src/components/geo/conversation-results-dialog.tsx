"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import { useGeoSequenceResults } from "@/lib/hooks/use-geo";
import type {
  ConversationResultsDialogProps,
  GeoSequenceTurnResult,
} from "@/types/geo";
import { formatEngineFamily, formatEngineWithMode } from "@/utils/geo-charts";
import { buildSequenceTurnGroups } from "@/utils/geo-sequences";

function EngineResult({ result }: { result: GeoSequenceTurnResult }) {
  const label = formatEngineFamily(result.engine);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs"
      title={`${formatEngineWithMode(result.engine)} · ${result.excerpt}`}
    >
      <EngineIcon className="size-3.5" engine={result.engine} />
      {label}
      {result.mentioned ? (
        <span className="font-medium text-geo-up tabular-nums">
          {result.position !== null ? `#${result.position}` : "Mentioned"}
        </span>
      ) : (
        <span className="text-muted-foreground">Absent</span>
      )}
    </span>
  );
}

export function ConversationResultsDialog({
  open,
  onOpenChange,
  organizationId,
  sequence,
}: ConversationResultsDialogProps) {
  const { data, isLoading } = useGeoSequenceResults(
    organizationId,
    open ? sequence?.id : undefined
  );

  const turns = useMemo(
    () => buildSequenceTurnGroups(data?.results ?? [], sequence?.id),
    [data, sequence]
  );

  if (!sequence) {
    return null;
  }

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{sequence.name}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Where your brand shows up as the conversation unfolds.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="max-h-[60svh] space-y-4 overflow-y-auto px-4 md:px-0">
          {isLoading && <Skeleton className="h-40 w-full" />}
          {!isLoading && turns.length === 0 && (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No results yet. Run a scan to play this conversation against the
              engines.
            </p>
          )}
          {turns.map(([turn, results]) => (
            <div className="flex items-start gap-2" key={turn}>
              <span className="mt-2 w-5 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
                {turn}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-3 py-2 text-sm">
                  {results[0]?.prompt}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {results.map((result) => (
                    <EngineResult
                      key={`${result.turn}-${result.engine}`}
                      result={result}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
