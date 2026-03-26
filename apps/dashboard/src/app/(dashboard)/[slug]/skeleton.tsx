"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

export function DashboardPageSkeleton() {
  const id = useId();
  const skeletonBase = `${id}-card`;
  const skeletonKeys = [
    `${skeletonBase}-1`,
    `${skeletonBase}-2`,
    `${skeletonBase}-3`,
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {skeletonKeys.map((key) => (
              <Skeleton className="h-[8.75rem] rounded-lg" key={key} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
