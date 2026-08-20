"use client";

import { useMemo } from "react";
import { FunnelChart } from "@/components/charts/funnel-chart";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import type { PromptFunnelCardProps } from "@/types/geo";
import { buildPromptVisibilityFunnel } from "@/utils/geo-prompts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

function promptFunnelReadout(isScanning: boolean, promptCount: number): string {
  if (isScanning) {
    return "scanning now";
  }
  if (promptCount > 0) {
    return `${promptCount.toLocaleString()} prompts tracked`;
  }
  return "no prompts yet";
}

export function PromptFunnelCard({
  promptCount,
  results,
  isScanning = false,
}: PromptFunnelCardProps) {
  const stages = useMemo(
    () => buildPromptVisibilityFunnel(promptCount, results),
    [promptCount, results]
  );

  return (
    <InstrumentSection
      className="h-full"
      eyebrow="Prompt funnel"
      readout={promptFunnelReadout(isScanning, promptCount)}
    >
      {promptCount === 0 || results.length === 0 ? (
        <InstrumentEmpty
          busy={isScanning}
          message={geoScanEmptyMessage(
            isScanning,
            "Run a scan to see how your prompts convert"
          )}
          seed="geo-prompt-funnel"
        />
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            How many tracked prompts get you mentioned, and how many rank you
            near the top
          </p>
          <FunnelChart
            className="h-40 w-full"
            data={stages}
            orientation="horizontal"
            showPercentage
            showValues
          />
        </div>
      )}
    </InstrumentSection>
  );
}
