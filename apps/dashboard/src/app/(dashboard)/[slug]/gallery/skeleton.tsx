"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";
import { PageContainer } from "@/components/layout/container";

export function GalleryPageSkeleton() {
  const id = useId();
  const skeletonKeys = [
    `${id}-card-1`,
    `${id}-card-2`,
    `${id}-card-3`,
    `${id}-card-4`,
    `${id}-card-5`,
    `${id}-card-6`,
  ];

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-36 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonKeys.map((key) => (
            <Skeleton className="h-64 rounded-lg" key={key} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
