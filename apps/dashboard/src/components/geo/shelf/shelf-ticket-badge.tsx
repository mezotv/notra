"use client";

import { Badge } from "@notra/ui/components/ui/badge";

import { GEO_SHELF_OPPORTUNITY_STATUS_LABELS } from "@/constants/geo-shelf";
import { cn } from "@/lib/utils";
import type { GeoShelfTicketBadgeProps } from "@/types/geo-shelf";

const TICKET_CLASSES = {
  open: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  won: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  lost: "border-border bg-muted/60 text-muted-foreground",
  dismissed: "border-border bg-muted/60 text-muted-foreground line-through",
} as const;

export function ShelfTicketBadge({
  status,
  className,
}: GeoShelfTicketBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-sm text-[0.6875rem] whitespace-nowrap",
        TICKET_CLASSES[status],
        className
      )}
      variant="outline"
    >
      {GEO_SHELF_OPPORTUNITY_STATUS_LABELS[status]}
    </Badge>
  );
}
