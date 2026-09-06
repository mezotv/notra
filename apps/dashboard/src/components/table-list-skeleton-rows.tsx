"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

import type { TableListSkeletonRowsProps } from "@/types/components/table-list-skeleton";

export function TableListSkeletonRows({ count }: TableListSkeletonRowsProps) {
  const id = useId();

  return Array.from({ length: count }).map((_, index) => (
    <div className="flex items-center gap-4 py-2" key={`${id}-row-${index}`}>
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-4 w-20" />
      <div className="ml-auto">
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  ));
}
