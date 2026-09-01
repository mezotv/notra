"use client";

import {
  GEO_GAPS_METER_STEPS,
  GEO_GAPS_METER_TONE_CLASS,
} from "@notra/ui/constants/geo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { gapMeterTone } from "@notra/ui/lib/geo-gaps";
import { cn } from "@notra/ui/lib/utils";
import type { GapMeterProps } from "@notra/ui/types/geo";

const METER_STEPS = Array.from(
  { length: GEO_GAPS_METER_STEPS },
  (_, index) => index + 1
);

export function GapMeter({ level, label }: GapMeterProps) {
  const filledClass = GEO_GAPS_METER_TONE_CLASS[gapMeterTone(level)];
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={label}
            className="inline-flex h-4 cursor-default items-end gap-1"
          />
        }
      >
        {METER_STEPS.map((step) => (
          <span
            className={cn(
              "w-1.5 rounded-[1px]",
              step <= level ? cn("h-4", filledClass) : "h-2.5 bg-muted"
            )}
            key={step}
          />
        ))}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
