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
      bodyClassName="flex min-h-0 flex-1 flex-col justify-center"
      className="h-full"
      description="How many tracked prompts get you mentioned, and how many rank you near the top"
      eyebrow="Prompt funnel"
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
        <FunnelChart
          className="h-48 w-full"
          data={stages}
          enterTransition={{ duration: 0 }}
          orientation="horizontal"
          showPercentage
          showValues
          staggerDelay={0}
        />
      )}
    </InstrumentSection>
  );
}
