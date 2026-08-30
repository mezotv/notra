"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  GEO_CHANGE_KIND_LABELS,
  GEO_CHANGES_EMPTY_NEEDS_SCANS,
  GEO_CHANGES_EMPTY_NO_CHANGES,
  GEO_CHANGES_LABEL,
  GEO_CHANGES_SHOW_LESS,
  GEO_CHANGES_VISIBLE,
  GEO_EMPTY_PROMPT_RESULTS,
} from "@notra/geo-core/constants/geo";
import type { GeoChangeEvent } from "@notra/geo-core/types/geo";
import { geoScanEmptyMessage } from "@notra/geo-core/utils/geo-scan";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { EngineIcon } from "@/components/geo/engine-icon";
import { PromptDetailDialog } from "@/components/geo/prompt-detail-dialog";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import {
  GEO_CHANGE_ICON_SIZE,
  GEO_CHANGE_KIND_ICONS,
  GEO_CHANGE_KIND_TONE_CLASSES,
} from "@/constants/geo-change-icons";
import { useGeoChanges } from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import type {
  GeoChangeRowProps,
  GeoChangeSummaryChipProps,
  GeoChangesSummaryRowProps,
  WhatChangedCardProps,
} from "@/types/geo";
import {
  describeGeoChange,
  geoChangesShowAllLabel,
  geoChangesSubline,
  geoChangesSummaryChips,
} from "@/utils/geo-changes";
import { withGeoProject } from "@/utils/geo-paths";
import { promptTableRowForId } from "@/utils/geo-prompts";

const TOGGLE_CLASS =
  "text-muted-foreground hover:text-foreground w-full py-2 text-center text-xs underline-offset-4 hover:underline";

function SummaryChip({ label, value }: GeoChangeSummaryChipProps) {
  return (
    <Badge
      className={cn(
        "rounded-sm text-[0.6875rem] whitespace-nowrap tabular-nums",
        value === 0 && "text-muted-foreground"
      )}
      variant="outline"
    >
      {label} {value.toLocaleString()}
    </Badge>
  );
}

function SummaryRow({ summary }: GeoChangesSummaryRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {geoChangesSummaryChips(summary).map((chip) => (
        <SummaryChip key={chip.key} label={chip.label} value={chip.value} />
      ))}
    </div>
  );
}

function ChangeRow({ event, onOpen }: GeoChangeRowProps) {
  const sentence = describeGeoChange(event);
  return (
    <button
      aria-label={`${GEO_CHANGE_KIND_LABELS[event.kind]}: ${event.prompt}`}
      className="hover:bg-muted/50 flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0"
      onClick={() => onOpen(event)}
      type="button"
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center",
          GEO_CHANGE_KIND_TONE_CLASSES[event.kind]
        )}
        title={GEO_CHANGE_KIND_LABELS[event.kind]}
      >
        <HugeiconsIcon
          icon={GEO_CHANGE_KIND_ICONS[event.kind]}
          size={GEO_CHANGE_ICON_SIZE}
        />
      </span>
      <span className="flex size-4 shrink-0 items-center justify-center">
        <EngineIcon engine={event.engine} />
      </span>
      <TruncateWithTooltip className="min-w-0 flex-1 text-sm">
        {event.prompt}
      </TruncateWithTooltip>
      <TruncateWithTooltip className="text-muted-foreground hidden min-w-0 flex-1 text-xs sm:block">
        {sentence}
      </TruncateWithTooltip>
    </button>
  );
}

function ChangesSkeleton() {
  const id = useId();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-5 w-20" key={`${id}-chip-${index}`} />
        ))}
      </div>
      <div className="rounded-2xl border">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="flex h-11 items-center gap-3 border-b px-3 last:border-b-0"
            key={`${id}-row-${index}`}
          >
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WhatChangedCard({
  organizationId,
  organizationSlug,
  promptResults = GEO_EMPTY_PROMPT_RESULTS,
  isScanning = false,
}: WhatChangedCardProps) {
  const { projectId } = useGeoProjectScope();
  const router = useRouter();
  const { data, isPending } = useGeoChanges(organizationId);
  const [expanded, setExpanded] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailRow = detailId
    ? promptTableRowForId(detailId, promptResults)
    : null;

  const events = data?.events ?? [];
  const visible = expanded ? events : events.slice(0, GEO_CHANGES_VISIBLE);
  const hasOverflow = events.length > GEO_CHANGES_VISIBLE;

  function openEvent(event: GeoChangeEvent) {
    if (promptTableRowForId(event.promptId, promptResults)) {
      setDetailId(event.promptId);
      return;
    }
    router.push(
      withGeoProject(
        `/${organizationSlug}/geo/prompts?q=${encodeURIComponent(event.prompt)}`,
        projectId
      )
    );
  }

  let body = <ChangesSkeleton />;
  if (!isPending && data) {
    if (!data.previousScan) {
      body = (
        <InstrumentEmpty
          busy={isScanning}
          className="h-40"
          message={geoScanEmptyMessage(
            isScanning,
            GEO_CHANGES_EMPTY_NEEDS_SCANS
          )}
          seed={GEO_CHANGES_LABEL}
        />
      );
    } else if (events.length === 0) {
      body = (
        <InstrumentEmpty
          busy={isScanning}
          className="h-40"
          message={geoScanEmptyMessage(
            isScanning,
            GEO_CHANGES_EMPTY_NO_CHANGES
          )}
          seed={GEO_CHANGES_LABEL}
        />
      );
    } else {
      body = (
        <div className="flex flex-col gap-3">
          <SummaryRow summary={data.summary} />
          <div className="rounded-2xl border">
            {visible.map((event) => (
              <ChangeRow
                event={event}
                key={`${event.kind}-${event.promptId}-${event.engine}`}
                onOpen={openEvent}
              />
            ))}
            {hasOverflow ? (
              <button
                className={cn(TOGGLE_CLASS, "border-t")}
                onClick={() => setExpanded((value) => !value)}
                type="button"
              >
                {expanded
                  ? GEO_CHANGES_SHOW_LESS
                  : geoChangesShowAllLabel(events.length)}
              </button>
            ) : null}
          </div>
        </div>
      );
    }
  }

  return (
    <>
      <InstrumentSection
        description={geoChangesSubline(
          data?.currentScan?.finishedAt,
          isScanning
        )}
        eyebrow={GEO_CHANGES_LABEL}
      >
        {body}
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
