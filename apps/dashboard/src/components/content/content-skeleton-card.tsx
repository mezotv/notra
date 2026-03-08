"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Loader2Icon } from "lucide-react";
import { getContentTypeLabel } from "@/components/content/content-card";
import { cn } from "@/lib/utils";
import type { ContentType } from "@/schemas/content";
import { OutputTypeIcon } from "@/utils/output-types";

interface ContentSkeletonCardProps {
  outputType: string;
  className?: string;
}

export function ContentSkeletonCard({
  outputType,
  className,
}: ContentSkeletonCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border/80 bg-muted/80 p-2",
        "h-full",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 py-1.5 pr-2 pl-2">
        <div className="flex min-w-0 items-center gap-2">
          <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
          <p className="truncate font-medium text-lg text-muted-foreground">
            Generating content...
          </p>
        </div>
      </div>
      <div className="flex-1 space-y-2 rounded-[0.75rem] border border-border/80 bg-background px-4 py-3">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Badge className="capitalize" variant="outline">
          draft
        </Badge>
        <Badge
          className="flex items-center gap-1 capitalize"
          variant="secondary"
        >
          <OutputTypeIcon className="size-3" outputType={outputType} />
          {getContentTypeLabel(outputType as ContentType)}
        </Badge>
      </div>
    </div>
  );
}
