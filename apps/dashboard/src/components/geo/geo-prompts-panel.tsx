"use client";

import { PromptResultsPreview } from "@/components/geo/prompt-results-preview";
import type { GeoPromptsPanelProps } from "@/types/geo";

export function GeoPromptsPanel({
  results,
  isScanning = false,
  gapsHref,
}: GeoPromptsPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <PromptResultsPreview
        gapsHref={gapsHref}
        isScanning={isScanning}
        results={results}
        variant="unseen"
      />
      <PromptResultsPreview isScanning={isScanning} results={results} />
    </div>
  );
}
