"use client";

import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";

import {
  GEO_SHELF_PLACEMENT_HINTS,
  GEO_SHELF_PLACEMENT_LABELS,
} from "@/constants/geo-shelf";
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

function evidenceHint(
  status: keyof typeof GEO_SHELF_PLACEMENT_HINTS,
  evidence: GeoShelfPlacementBadgeProps["evidence"]
): string | null {
  if (status === "unknown" || !evidence) {
    return null;
  }
  return evidence === "manual"
    ? "Marked by a teammate"
    : "Verified by fetching the page";
}

export function ShelfPlacementBadge({
  status,
  evidence,
  className,
  tooltip = true,
}: GeoShelfPlacementBadgeProps) {
  const resolved = status ?? "unknown";
  const label = GEO_SHELF_PLACEMENT_LABELS[resolved];
  const sourceHint = evidenceHint(resolved, evidence);
  const badge = (
    <Badge
      className={cn(
        "gap-1 rounded-sm text-[0.6875rem] whitespace-nowrap",
        PLACEMENT_CLASSES[resolved],
        className
      )}
      variant="outline"
    >
      <HugeiconsIcon
        className="size-3 shrink-0"
        icon={PLACEMENT_ICONS[resolved]}
        strokeWidth={2}
      />
      {label}
    </Badge>
  );

  if (!tooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex max-w-full cursor-help" />}
      >
        {badge}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-pretty">
        <span className="block font-medium">{label}</span>
        {GEO_SHELF_PLACEMENT_HINTS[resolved]}
        {sourceHint ? (
          <span className="text-muted-foreground mt-0.5 block">
            {sourceHint}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
