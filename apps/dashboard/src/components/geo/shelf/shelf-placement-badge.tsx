"use client";

import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";

import { GEO_SHELF_PLACEMENT_LABELS } from "@/constants/geo-shelf";
import { cn } from "@/lib/utils";
import type { GeoShelfPlacementBadgeProps } from "@/types/geo-shelf";

const PLACEMENT_ICONS = {
  present: CheckmarkCircle02Icon,
  absent: CancelCircleIcon,
  unknown: HelpCircleIcon,
} as const;

const PLACEMENT_CLASSES = {
  present:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  absent: "border-border bg-muted/60 text-muted-foreground",
  unknown: "border-dashed border-border text-muted-foreground",
} as const;

export function ShelfPlacementBadge({
  status,
  evidence,
  className,
}: GeoShelfPlacementBadgeProps) {
  const resolved = status ?? "unknown";
  let title =
    evidence === "manual"
      ? "Marked by a teammate"
      : "Verified by fetching the page";
  if (resolved === "unknown") {
    title = "Not checked yet";
  }
  return (
    <Badge
      className={cn(
        "gap-1 rounded-sm text-[0.6875rem] whitespace-nowrap",
        PLACEMENT_CLASSES[resolved],
        className
      )}
      title={title}
      variant="outline"
    >
      <HugeiconsIcon
        className="size-3 shrink-0"
        icon={PLACEMENT_ICONS[resolved]}
        strokeWidth={2}
      />
      {GEO_SHELF_PLACEMENT_LABELS[resolved]}
    </Badge>
  );
}
