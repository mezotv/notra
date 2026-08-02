"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { useMemo } from "react";
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
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={cn(
            "truncate text-sm",
            model.scanned ? "font-medium text-foreground" : "text-foreground/70"
          )}
        >
          {model.label}
        </span>
        <span className="shrink-0 text-right text-xs tabular-nums">
          {model.scanned && model.mentionRate !== null ? (
            <span className="font-semibold text-foreground">
              {formatMentionRate(model.mentionRate)} mention rate
            </span>
          ) : (
            <span className="text-muted-foreground">not scanned</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              model.scanned ? "bg-foreground/80" : "bg-foreground/25"
            )}
            style={{ width: `${usageBarWidth(model.share, maxShare)}%` }}
          />
        </div>
        <span className="w-14 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
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
    <Card>
      <CardHeader>
        <CardTitle>Where AI usage actually happens</CardTitle>
        <CardDescription>
          {models.length > 0
            ? `Share of industry token volume per model. We scan ${scannedCount} of the top ${models.length}. ${usage?.attribution ?? ""}`
            : "Share of industry token volume per model, matched against the engines we scan"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <p className="flex h-40 items-center justify-center text-center text-muted-foreground text-sm">
            Run a scan to capture model usage share
          </p>
        ) : (
          <div className="space-y-4">
            {models.map((model) => (
              <UsageRow key={model.model} maxShare={maxShare} model={model} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
