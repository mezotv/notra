"use client";

import { Card, CardHeader } from "@notra/ui/components/ui/card";
import { useId } from "react";
import {
  EMPTY_STATE_CARD_COUNT,
  EMPTY_STATE_CARD_KEYS,
  EMPTY_STATE_CHART_BARS,
  EMPTY_STATE_COLUMN_KEYS,
  EMPTY_STATE_GUIDELINE_ASSET_KEYS,
  EMPTY_STATE_GUIDELINE_COLOR_KEYS,
  EMPTY_STATE_ROW_KEYS,
  EMPTY_STATE_SKILL_CARD_LAYOUTS,
  EMPTY_STATE_STAT_KEYS,
} from "@/constants/empty-state";
import { cn } from "@/lib/utils";
import type {
  EmptyStateCardsPreviewProps,
  EmptyStateCardsPreviewVariant,
  EmptyStateTablePreviewProps,
} from "@/types/components/empty-state";

const ROW_SCALE = [1, 0.74, 0.9, 0.62, 0.84, 0.7] as const;

function GhostBar({
  className,
  width,
}: {
  className?: string;
  width?: number | string;
}) {
  return (
    <div
      className={cn("h-3.5 rounded-md bg-muted-foreground/20", className)}
      style={width === undefined ? undefined : { width }}
    />
  );
}

function scaledWidth(base: number, row: number, column: number) {
  const scale = ROW_SCALE[row % ROW_SCALE.length] ?? 1;
  const columnNudge = 1 - (column % 3) * 0.08;
  return Math.max(28, Math.round(base * scale * columnNudge));
}

export function EmptyStateTablePreview({
  columns,
  rows = 6,
}: EmptyStateTablePreviewProps) {
  const id = useId();
  return (
    <div className="overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-muted/80 shadow-2xs">
      <div className="flex items-center gap-4 border-border/60 border-b bg-muted/80 px-4 py-2.5">
        {columns.map((width, column) => {
          const columnKey = EMPTY_STATE_COLUMN_KEYS[column];
          if (!columnKey) {
            return null;
          }
          return (
            <GhostBar
              className="h-3"
              key={`${id}-header-${columnKey}`}
              width={Math.round(width * 0.7)}
            />
          );
        })}
      </div>
      {EMPTY_STATE_ROW_KEYS.slice(0, rows).map((rowKey, row) => (
        <div
          className="flex items-center gap-4 border-border/60 border-b bg-background px-4 py-3 last:border-b-0"
          key={`${id}-${rowKey}`}
        >
          {columns.map((width, column) => {
            const columnKey = EMPTY_STATE_COLUMN_KEYS[column];
            if (!columnKey) {
              return null;
            }
            return (
              <GhostBar
                className="h-4"
                key={`${id}-${rowKey}-${columnKey}`}
                width={scaledWidth(width, row, column)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ContentCardGhost() {
  return (
    <div className="flex h-[8.75rem] flex-col rounded-lg border border-border/80 bg-muted/80 p-2">
      <div className="px-2 py-1.5">
        <GhostBar className="h-4" width="68%" />
      </div>
      <div className="flex-1 space-y-2 rounded-md bg-background/70 px-3 py-2.5">
        <GhostBar className="h-3 w-full" />
        <GhostBar className="h-3 w-5/6" />
        <GhostBar className="h-3 w-2/3" />
      </div>
      <div className="flex gap-2 px-2 py-2">
        <GhostBar className="h-5 w-12 rounded-full" />
        <GhostBar className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

function SkillCardGhost({ index }: { index: number }) {
  const layout =
    EMPTY_STATE_SKILL_CARD_LAYOUTS[
      index % EMPTY_STATE_SKILL_CARD_LAYOUTS.length
    ];

  if (!layout) {
    return null;
  }

  return (
    <Card className="h-full min-h-[9.5rem] gap-3">
      <CardHeader>
        <GhostBar className="h-5 rounded-md" width={layout.title} />
        <div className="space-y-2 pt-1">
          {layout.lines.map((line) => (
            <GhostBar className="h-3.5" key={line.key} width={line.width} />
          ))}
        </div>
        <GhostBar className="mt-2 h-3" width={layout.date} />
      </CardHeader>
    </Card>
  );
}

function ReferenceCardGhost() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="size-8 shrink-0 rounded-full bg-muted-foreground/20" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <GhostBar className="h-3.5 w-28" />
          <GhostBar className="h-3 w-16" />
        </div>
      </div>
      <GhostBar className="h-3.5 w-full" />
      <GhostBar className="h-3.5 w-5/6" />
      <GhostBar className="h-3.5 w-2/3" />
    </div>
  );
}

function RunCardGhost() {
  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex items-center gap-2">
        <GhostBar className="h-5 w-16 rounded-full" />
        <GhostBar className="h-5 w-20 rounded-full" />
        <GhostBar className="ml-auto h-3 w-16" />
      </div>
      <div className="space-y-2">
        <GhostBar className="h-4 w-3/4" />
        <GhostBar className="h-3 w-full" />
        <GhostBar className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function IntegrationCardGhost() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-4">
      <div className="size-10 shrink-0 rounded-lg bg-muted-foreground/20" />
      <div className="min-w-0 flex-1 space-y-2">
        <GhostBar className="h-4 w-36" />
        <GhostBar className="h-3 w-52" />
      </div>
      <GhostBar className="h-6 w-16 rounded-full" />
    </div>
  );
}

function AnalyticsChartGhost({ bars }: { bars: readonly number[] }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4">
      <GhostBar className="h-4 w-24" />
      <GhostBar className="mt-2 h-3 w-40" />
      <div className="mt-5 flex h-32 items-end gap-1.5">
        {bars.map((height) => (
          <div
            className="flex-1 rounded-sm bg-muted-foreground/20"
            key={`bar-${height}`}
            style={{ height }}
          />
        ))}
      </div>
    </div>
  );
}

export function EmptyStateAnalyticsPreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {EMPTY_STATE_STAT_KEYS.map((key) => (
          <div
            className="flex flex-col justify-center gap-2 rounded-xl border border-border/80 bg-card p-4"
            key={key}
          >
            <GhostBar className="h-3 w-20" />
            <GhostBar className="h-7 w-16" />
            <GhostBar className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnalyticsChartGhost bars={EMPTY_STATE_CHART_BARS} />
        </div>
        <AnalyticsChartGhost bars={EMPTY_STATE_CHART_BARS.slice(3, 11)} />
      </div>
    </div>
  );
}

export function EmptyStateGuidelinesPreview() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {EMPTY_STATE_GUIDELINE_ASSET_KEYS.map((key) => (
          <div
            className="overflow-hidden rounded-xl border border-border/80 bg-card"
            key={key}
          >
            <div className="flex h-28 items-center justify-center bg-muted/50">
              <div className="size-12 rounded-lg bg-muted-foreground/20" />
            </div>
            <div className="space-y-2 p-3">
              <GhostBar className="h-3.5 w-24" />
              <GhostBar className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {EMPTY_STATE_GUIDELINE_COLOR_KEYS.map((key) => (
          <div
            className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3"
            key={key}
          >
            <div className="size-9 shrink-0 rounded-lg bg-muted-foreground/20" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <GhostBar className="h-3.5 w-24" />
              <GhostBar className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getCardGridClass(
  variant: EmptyStateCardsPreviewVariant,
  columns?: 2 | 3
) {
  if (columns === 2) {
    return "grid-cols-1 sm:grid-cols-2";
  }
  if (columns === 3) {
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }
  if (variant === "run" || variant === "integration") {
    return "grid-cols-1";
  }
  if (variant === "reference") {
    return "grid-cols-1 sm:grid-cols-2";
  }
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

export function EmptyStateCardsPreview({
  variant = "content",
  count,
  columns,
}: EmptyStateCardsPreviewProps) {
  const id = useId();
  const resolvedCount = count ?? EMPTY_STATE_CARD_COUNT[variant];

  return (
    <div
      className={cn(
        "grid",
        variant === "skill" ? "gap-4" : "gap-3",
        getCardGridClass(variant, columns)
      )}
    >
      {EMPTY_STATE_CARD_KEYS.slice(0, resolvedCount).map((cardKey, index) => {
        if (variant === "skill") {
          return <SkillCardGhost index={index} key={`${id}-${cardKey}`} />;
        }
        if (variant === "reference") {
          return <ReferenceCardGhost key={`${id}-${cardKey}`} />;
        }
        if (variant === "run") {
          return <RunCardGhost key={`${id}-${cardKey}`} />;
        }
        if (variant === "integration") {
          return <IntegrationCardGhost key={`${id}-${cardKey}`} />;
        }
        return <ContentCardGhost key={`${id}-${cardKey}`} />;
      })}
    </div>
  );
}
