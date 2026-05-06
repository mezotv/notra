"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

const SCHEDULE_SKELETON_ROWS = ["one", "two", "three", "four", "five"];

export function SchedulePageSkeleton() {
  const id = useId();
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border">
          <div className="space-y-3 p-4">
            {SCHEDULE_SKELETON_ROWS.map((row) => (
              <div
                className="flex items-center gap-4 py-2"
                key={`${id}-row-${row}`}
              >
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <div className="ml-auto">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
