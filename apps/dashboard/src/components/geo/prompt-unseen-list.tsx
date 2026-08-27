"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { buttonVariants } from "@/components/button";
import { EngineIcon } from "@/components/geo/engine-icon";
import { LogoStack } from "@/components/geo/logo-stack";
import { PromptDetailDialog } from "@/components/geo/prompt-detail-dialog";
import { InstrumentSection } from "@/components/instrument/instrument-module";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import { GEO_FAMILY_IMPROVE_CTA_GAPS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { GeoPromptSummary, PromptUnseenListProps } from "@/types/geo";
import { engineFamilyLabel } from "@/utils/geo-charts";
import {
  scannedEngineFamilies,
  summarizePromptResults,
  unseenPromptSummaries,
} from "@/utils/geo-presence";
import { promptTableRowForId } from "@/utils/geo-prompts";

function UnseenRow({
  summary,
  onOpen,
}: {
  summary: GeoPromptSummary;
  onOpen: () => void;
}) {
  const families = scannedEngineFamilies(summary);

  return (
    <button
      className="hover:bg-muted/50 flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0"
      onClick={onOpen}
      type="button"
    >
      <TruncateWithTooltip className="min-w-0 flex-1 text-sm">
        {summary.prompt}
      </TruncateWithTooltip>
      <LogoStack
        items={families.map((family) => ({
          key: family,
          label: engineFamilyLabel(family),
          renderIcon: (className) => (
            <EngineIcon className={className} engine={family} />
          ),
        }))}
      />
    </button>
  );
}

export function PromptUnseenList({
  results,
  isScanning = false,
  gapsHref,
}: PromptUnseenListProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const rows = useMemo(
    () => unseenPromptSummaries(summarizePromptResults(results)),
    [results]
  );
  const detailRow = detailId ? promptTableRowForId(detailId, results) : null;

  if (rows.length === 0) {
    return null;
  }

  return (
    <>
      <InstrumentSection
        action={
          gapsHref ? (
            <Link
              className={cn(buttonVariants({ size: "sm" }))}
              href={gapsHref}
              prefetch={true}
            >
              {GEO_FAMILY_IMPROVE_CTA_GAPS}
            </Link>
          ) : undefined
        }
        description="Questions no engine named you on."
        eyebrow="Unseen"
      >
        <div className="max-h-72 overflow-y-auto rounded-2xl border">
          {rows.map((row) => (
            <UnseenRow
              key={row.promptId}
              onOpen={() => setDetailId(row.promptId)}
              summary={row}
            />
          ))}
        </div>
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
