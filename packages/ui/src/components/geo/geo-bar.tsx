"use client";

import { cn } from "@notra/ui/lib/utils";
import type { GeoBarProps } from "@notra/ui/types/geo";
import { barWidthPercent } from "@notra/ui/lib/geo-bar";

export function GeoBar({
  value,
  max = 1,
  className,
  fillClassName,
  fillColor,
}: GeoBarProps) {
  const hasFillTone =
    Boolean(fillColor) || Boolean(fillClassName?.includes("bg-"));
  return (
    <span
      className={cn(
        "bg-muted block h-1.5 w-full overflow-hidden rounded-full",
        className
      )}
    >
      <span
        className={cn(
          "block h-full",
          hasFillTone ? undefined : "bg-geo-search",
          fillClassName
        )}
        style={{
          width: `${barWidthPercent(value, max)}%`,
          ...(fillColor ? { backgroundColor: fillColor } : {}),
        }}
      />
    </span>
  );
}
