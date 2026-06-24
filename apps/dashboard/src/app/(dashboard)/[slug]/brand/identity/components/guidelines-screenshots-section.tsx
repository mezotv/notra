"use client";

import { ComputerIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageZoom } from "@notra/ui/components/kibo-ui/image-zoom";
import Image from "next/image";
import { useState } from "react";
import { SCREENSHOT_KIND_LABELS } from "@/constants/brand-guideline-ui";
import type { GuidelinesScreenshotsSectionProps } from "@/types/brand-identity";
import type { BrandGuidelineScreenshot } from "@/types/hooks/brand-guidelines";
import { joinMeta } from "@/utils/brand-guideline-display";
import { GuidelinesResourceActions } from "./guidelines-resource-actions";
import { GuidelinesScreenshotEditDialog } from "./guidelines-screenshot-edit-dialog";

export function GuidelinesScreenshotsSection({
  screenshots,
  organizationId,
  voiceId,
}: GuidelinesScreenshotsSectionProps) {
  const [editing, setEditing] = useState<BrandGuidelineScreenshot | null>(null);

  if (screenshots.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={ComputerIcon}
        />
        <h2 className="font-semibold text-sm">Landing Page Screenshots</h2>
        <span className="text-muted-foreground text-xs tabular-nums">
          {screenshots.length}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {screenshots.map((screenshot) => {
          const label = SCREENSHOT_KIND_LABELS[screenshot.kind];
          const meta = joinMeta([
            `${screenshot.width}×${screenshot.height}`,
            screenshot.format.toUpperCase(),
            screenshot.fullPage ? "Full page" : null,
          ]);

          return (
            <div
              className="flex flex-col overflow-hidden rounded-xl border"
              key={screenshot.id}
            >
              <div className="bg-muted/40 p-2 text-center">
                <ImageZoom className="inline-block max-w-full" zoomMargin={24}>
                  <Image
                    alt={label}
                    className="block h-auto max-h-48 w-auto max-w-full object-contain"
                    height={screenshot.height}
                    src={screenshot.url}
                    unoptimized
                    width={screenshot.width}
                  />
                </ImageZoom>
              </div>

              <div className="flex items-center justify-between gap-2 border-t p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{label}</p>
                  <p className="truncate text-muted-foreground text-xs tabular-nums">
                    {meta}
                  </p>
                </div>

                <GuidelinesResourceActions
                  label={label}
                  onEdit={() => setEditing(screenshot)}
                  url={screenshot.url}
                />
              </div>
            </div>
          );
        })}
      </div>

      {editing ? (
        <GuidelinesScreenshotEditDialog
          onOpenChange={(open) => {
            if (!open) {
              setEditing(null);
            }
          }}
          open
          organizationId={organizationId}
          screenshot={editing}
          voiceId={voiceId}
        />
      ) : null}
    </section>
  );
}
