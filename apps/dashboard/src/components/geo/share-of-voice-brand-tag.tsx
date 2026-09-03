"use client";

import {
  GEO_BRAND_DISCOVERED_LABEL,
  GEO_BRAND_TRACK_ACTION,
  GEO_BRAND_TRACKED_LABEL,
} from "@notra/geo-core/constants/geo";
import { Badge } from "@notra/ui/components/ui/badge";

import { Button } from "@/components/button";
import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import { cn } from "@/lib/utils";
import type {
  BrandTrackingBadgeProps,
  ShareOfVoiceBrandTagProps,
  TrackBrandButtonProps,
} from "@/types/geo";

export function BrandTrackingBadge({
  tracked,
  className,
}: BrandTrackingBadgeProps) {
  return (
    <Badge
      className={cn("text-muted-foreground shrink-0 font-normal", className)}
      variant={tracked ? "secondary" : "outline"}
    >
      {tracked ? GEO_BRAND_TRACKED_LABEL : GEO_BRAND_DISCOVERED_LABEL}
    </Badge>
  );
}

export function TrackBrandButton({
  brand,
  onTrack,
  className,
}: TrackBrandButtonProps) {
  return (
    <Button
      aria-label={`${GEO_BRAND_TRACK_ACTION} ${brand}`}
      className={cn("text-muted-foreground h-5 shrink-0 px-1.5", className)}
      onClick={(event) => {
        event.stopPropagation();
        onTrack(brand);
      }}
      onPointerDown={(event) => event.stopPropagation()}
      size="xs"
      variant="ghost"
    >
      {GEO_BRAND_TRACK_ACTION}
    </Button>
  );
}

export function ShareOfVoiceBrandTag({
  row,
  own,
  onTrack,
}: ShareOfVoiceBrandTagProps) {
  if (own || row.brand === CHART_OTHER_SLICE_LABEL || row.tracked) {
    return null;
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <BrandTrackingBadge tracked={row.tracked} />
      {!row.tracked && onTrack ? (
        <TrackBrandButton brand={row.brand} onTrack={onTrack} />
      ) : null}
    </span>
  );
}
