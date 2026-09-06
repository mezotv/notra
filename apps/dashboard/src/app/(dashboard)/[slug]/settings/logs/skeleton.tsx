"use client";

import { TableListSkeletonRows } from "@/components/table-list-skeleton-rows";

export function LogsPageSkeleton() {
  return (
    <div className="space-y-3">
      <div className="border-border/80 border-b-border/40 bg-muted/80 overflow-hidden rounded-lg border">
        <div className="bg-background space-y-3 rounded-t-lg p-4">
          <TableListSkeletonRows count={10} />
        </div>
      </div>
    </div>
  );
}
