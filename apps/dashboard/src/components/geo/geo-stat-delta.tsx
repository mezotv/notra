"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  MinusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";

import { cn } from "@/lib/utils";
import type { GeoStatDeltaProps, GeoStatDeltaTone } from "@/types/geo";
import { formatGeoStatDelta, geoStatDeltaTone } from "@/utils/geo-charts";

const PILL_CLASS =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.6875rem] leading-none font-medium tabular-nums";

const TONE_CLASS: Record<GeoStatDeltaTone, string> = {
  up: "bg-geo-up/10 text-geo-up",
  down: "bg-geo-down/10 text-geo-down",
  flat: "bg-muted text-muted-foreground",
};

const ICON_RING_CLASS: Record<GeoStatDeltaTone, string> = {
  up: "bg-geo-up text-white",
  down: "bg-geo-down text-white",
  flat: "bg-muted-foreground/75 text-background",
};

const TONE_ICON = {
  up: ArrowUp01Icon,
  down: ArrowDown01Icon,
  flat: MinusSignIcon,
} as const;

function GeoStatDeltaIcon({ tone }: { tone: GeoStatDeltaTone }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-3.5 shrink-0 items-center justify-center rounded-full",
        ICON_RING_CLASS[tone]
      )}
    >
      <HugeiconsIcon icon={TONE_ICON[tone]} size={8} strokeWidth={2.5} />
    </span>
  );
}

export function GeoStatDelta({
  delta,
  kind = "mentions",
  label,
  hint,
  className,
}: GeoStatDeltaProps) {
  if (delta === null) {
    return null;
  }

  const tone = geoStatDeltaTone(delta, kind);
  const formatted = formatGeoStatDelta(delta, kind);
  const pill = (
    <span className={cn(PILL_CLASS, TONE_CLASS[tone], className)}>
      <GeoStatDeltaIcon tone={tone} />
      {formatted}
    </span>
  );

  if (!hint) {
    return pill;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            aria-label={
              label ? `${label} ${formatted} ${hint}` : `${formatted} ${hint}`
            }
            className="inline-flex cursor-help"
            type="button"
          />
        }
      >
        {pill}
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
