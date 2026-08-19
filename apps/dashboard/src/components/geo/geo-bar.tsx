"use client";

import { cn } from "@/lib/utils";
import type { GeoBarProps } from "@/types/geo";
import { barWidthPercent } from "@/utils/geo-charts";

export function GeoBar({
  value,
  max = 1,
  className,
  fillClassName,
}: GeoBarProps) {
  return (
    <span
      className={cn(
        "block h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <span
        className={cn("block h-full bg-chart-1", fillClassName)}
        style={{ width: `${barWidthPercent(value, max)}%` }}
      />
    </span>
  );
}
