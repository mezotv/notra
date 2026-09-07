"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { TableListSkeletonRows } from "@/components/table-list-skeleton-rows";

export function EventsPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-3">
        <div className="border-border/80 border-b-border/40 bg-muted/80 overflow-hidden rounded-lg border shadow-2xs">
          <div className="bg-background space-y-3 rounded-t-lg p-4">
            <TableListSkeletonRows count={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
