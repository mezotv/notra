"use client";

import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  CircleIcon,
  MinusSignCircleIcon,
  Progress03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";

import { GEO_SHELF_OPPORTUNITY_STATUS_LABELS } from "@/constants/geo-shelf";
import { cn } from "@/lib/utils";
import type { GeoShelfTicketBadgeProps } from "@/types/geo-shelf";

const TICKET_ICONS = {
  open: CircleIcon,
  in_progress: Progress03Icon,
  won: CheckmarkCircle02Icon,
  lost: CancelCircleIcon,
  dismissed: MinusSignCircleIcon,
} as const;

const TICKET_TEXT = {
  open: "text-sky-700 dark:text-sky-300",
  in_progress: "text-amber-700 dark:text-amber-300",
  won: "text-emerald-700 dark:text-emerald-300",
  lost: "text-muted-foreground",
  dismissed: "text-muted-foreground",
} as const;

const TICKET_BADGE = {
  open: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  won: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  lost: "border-border bg-muted/60 text-muted-foreground",
  dismissed: "border-border bg-muted/60 text-muted-foreground line-through",
} as const;

export function ShelfTicketMark({
  status,
  className,
}: GeoShelfTicketBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        TICKET_TEXT[status],
        status === "dismissed" && "line-through",
        className
      )}
    >
      <HugeiconsIcon
        aria-hidden="true"
        className="size-3.5 shrink-0"
        icon={TICKET_ICONS[status]}
        strokeWidth={2}
      />
      {GEO_SHELF_OPPORTUNITY_STATUS_LABELS[status]}
    </span>
  );
}

export function ShelfTicketBadge({
  status,
  className,
}: GeoShelfTicketBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-sm text-[0.6875rem] whitespace-nowrap",
        TICKET_BADGE[status],
        className
      )}
      variant="outline"
    >
      {GEO_SHELF_OPPORTUNITY_STATUS_LABELS[status]}
    </Badge>
  );
}
