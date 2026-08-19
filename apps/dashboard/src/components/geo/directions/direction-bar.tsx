"use client";

import { cn } from "@/lib/utils";
import type { DirectionBarProps } from "@/types/geo-directions";
import { barWidthPercent } from "@/utils/geo-charts";

export function DirectionBar({ value, max, className }: DirectionBarProps) {
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className="h-full bg-chart-1"
        style={{ width: `${barWidthPercent(value, max)}%` }}
      />
    </div>
  );
}
