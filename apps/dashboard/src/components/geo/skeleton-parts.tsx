"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

import type {
  GeoSectionSkeletonProps,
  GeoTableSkeletonProps,
} from "@/types/geo";

export function GeoSectionSkeleton({
  eyebrow,
  action,
  children,
}: GeoSectionSkeletonProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex h-7 items-center">
          <h2 className="text-foreground text-sm leading-none font-medium capitalize">
            {eyebrow}
          </h2>
        </div>
        {action}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

export function GeoTableSkeleton({ rows }: GeoTableSkeletonProps) {
  const id = useId();
  return (
    <div className="border-border overflow-hidden rounded-2xl border">
      <div className="bg-muted/40 flex h-10 items-center justify-between px-4">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="border-border/60 flex h-13 items-center justify-between gap-4 border-t px-4"
          key={`${id}-row-${index}`}
        >
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
