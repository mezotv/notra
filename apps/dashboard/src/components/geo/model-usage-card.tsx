"use client";

import { useMemo } from "react";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { cn } from "@/lib/utils";
import type { GeoModelUsageResponse, GeoModelUsageRow } from "@/types/geo";
import {
  formatMentionRate,
  formatUsageShare,
  usageBarWidth,
} from "@/utils/geo-charts";

interface ModelUsageCardProps {
  usage: GeoModelUsageResponse | undefined;
}

function UsageRow({
  model,
  maxShare,
}: {
  model: GeoModelUsageRow;
  maxShare: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={cn(
            "truncate text-sm",
            model.scanned ? "font-medium text-foreground" : "text-foreground/70"
          )}
        >
          {model.label}
        </span>
        <span className="shrink-0 text-right font-mono text-[0.6875rem] tabular-nums">
          {model.scanned && model.mentionRate !== null ? (
            <span className="text-foreground">
              {formatMentionRate(model.mentionRate)} mention rate
            </span>
          ) : (
            <span className="text-muted-foreground">not scanned</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden bg-muted">
          <div
            className={cn(
              "h-full",
              model.scanned ? "bg-foreground/80" : "bg-foreground/25"
            )}
            style={{ width: `${usageBarWidth(model.share, maxShare)}%` }}
          />
        </div>
        <span className="w-14 shrink-0 text-right font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
          {formatUsageShare(model.share)}
        </span>
      </div>
    </div>
  );
}

export function ModelUsageCard({ usage }: ModelUsageCardProps) {
  const models = usage?.models ?? [];
  const maxShare = useMemo(
    () => models.reduce((max, model) => Math.max(max, model.share), 0),
    [models]
  );
  const scannedCount = useMemo(
    () => models.filter((model) => model.scanned).length,
    [models]
  );

  return (
    <InstrumentModule
      eyebrow="Where AI usage actually happens"
      readout={
        models.length > 0
          ? `we scan ${scannedCount} of the top ${models.length} · ${usage?.attribution ?? ""}`
          : "industry token share per model"
      }
    >
      {models.length === 0 ? (
        <InstrumentEmpty
          className="h-40"
          message="Run a scan to capture model usage share"
          seed="Where AI usage actually happens"
        />
      ) : (
        <div className="space-y-3">
          {models.map((model) => (
            <UsageRow key={model.model} maxShare={maxShare} model={model} />
          ))}
        </div>
      )}
    </InstrumentModule>
  );
}
