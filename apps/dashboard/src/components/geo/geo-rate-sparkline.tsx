"use client";

import {
  GEO_RATE_SPARKLINE_HEIGHT,
  GEO_RATE_SPARKLINE_PADDING,
  GEO_RATE_SPARKLINE_WIDTH,
} from "@notra/geo-core/constants/geo";

import { cn } from "@/lib/utils";
import type { GeoRateSparklineProps } from "@/types/geo";
import { mentionRateSparklineLabel } from "@/utils/geo-charts";
import { sparklinePolyline } from "@/utils/sparkline-path";

export function GeoRateSparkline({
  points,
  className,
  ariaLabel,
  style,
  color,
  label,
}: GeoRateSparklineProps) {
  const values = points.map((point) => point.value);
  const polyline = sparklinePolyline({
    values,
    width: GEO_RATE_SPARKLINE_WIDTH,
    height: GEO_RATE_SPARKLINE_HEIGHT,
    padding: GEO_RATE_SPARKLINE_PADDING,
  });

  if (polyline.length === 0) {
    return null;
  }

  return (
    <svg
      aria-label={ariaLabel ?? label ?? mentionRateSparklineLabel(points)}
      className={cn("text-foreground h-5 w-14 shrink-0", className)}
      role="img"
      style={color ? { ...style, color } : style}
      viewBox={`0 0 ${GEO_RATE_SPARKLINE_WIDTH} ${GEO_RATE_SPARKLINE_HEIGHT}`}
    >
      <polyline
        fill="none"
        points={polyline}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
