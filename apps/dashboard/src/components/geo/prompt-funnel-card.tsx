"use client";

import { useMemo } from "react";
import { FunnelChart } from "@/components/charts/funnel-chart";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import type { PromptFunnelCardProps } from "@/types/geo";
import { buildPromptVisibilityFunnel } from "@/utils/geo-prompts";

export function PromptFunnelCard({
  promptCount,
  results,
}: PromptFunnelCardProps) {
  const stages = useMemo(
    () => buildPromptVisibilityFunnel(promptCount, results),
    [promptCount, results]
  );

  return (
    <InstrumentSection
      eyebrow="Prompt funnel"
      readout={
        promptCount > 0
          ? `${promptCount.toLocaleString()} prompts tracked`
          : "no prompts yet"
      }
    >
      {promptCount === 0 || results.length === 0 ? (
        <InstrumentEmpty
          message="Run a scan to see how your prompts convert"
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
