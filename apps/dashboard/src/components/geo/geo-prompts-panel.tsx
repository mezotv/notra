"use client";

import { PromptResultsPreview } from "@/components/geo/prompt-results-preview";
import { PromptUnseenList } from "@/components/geo/prompt-unseen-list";
import type { GeoPromptsPanelProps } from "@/types/geo";

export function GeoPromptsPanel({
  results,
  isScanning = false,
  action,
  gapsHref,
}: GeoPromptsPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <PromptUnseenList
        gapsHref={gapsHref}
        isScanning={isScanning}
        results={results}
      />
      <PromptResultsPreview
        action={action}
        isScanning={isScanning}
        results={results}
      />
    </div>
  );
}
