"use client";

import { Card } from "@notra/ui/components/ui/card";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

export function SkillsPageSkeleton() {
  const id = useId();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card className="gap-3 p-4" key={`${id}-card-${i}`}>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-1 h-3 w-24" />
        </Card>
      ))}
    </div>
  );
}
