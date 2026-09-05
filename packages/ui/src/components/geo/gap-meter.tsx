"use client";

import { GEO_GAPS_METER_STEPS } from "@notra/ui/constants/geo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { gapMeterTone } from "@notra/ui/lib/geo-gaps";
import { cn } from "@notra/ui/lib/utils";
import type { GapMeterProps, GeoGapsMeterTone } from "@notra/ui/types/geo";

const METER_STEPS = Array.from(
  { length: GEO_GAPS_METER_STEPS },
  (_, index) => index
);

const TONE_CLASS: Record<GeoGapsMeterTone, string> = {
  empty: "bg-muted",
  low: "bg-geo-down",
  mid: "bg-geo-mid",
  high: "bg-geo-up",
};

export function GapMeter({ level, label }: GapMeterProps) {
  const filledClass = TONE_CLASS[gapMeterTone(level)];
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={label}
            className="inline-flex h-4 cursor-default items-center gap-2"
          />
        }
      >
        <span className="inline-flex h-4 items-end gap-1">
          {METER_STEPS.map((index) => (
            <span
              className={cn(
                "w-1.5 rounded-[0.0625rem]",
                index < level ? cn("h-4", filledClass) : "h-2.5 bg-muted"
              )}
              key={index}
            />
          ))}
        </span>
        <span className="text-xs tabular-nums">
          {level}/{GEO_GAPS_METER_STEPS}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
