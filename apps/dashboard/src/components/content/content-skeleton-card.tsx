"use client";

import type { ContentType } from "@notra/ai/schemas/content";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { BracesIcon, Loader2Icon } from "lucide-react";

import { getContentTypeLabel } from "@/components/content/content-card";
import { cn } from "@/lib/utils";
import { OutputTypeIcon } from "@/utils/output-types";

interface ContentSkeletonCardProps {
  outputType: string;
  className?: string;
  source?: "api" | "dashboard";
}

export function ContentSkeletonCard({
  outputType,
  className,
  source,
}: ContentSkeletonCardProps) {
  return (
    <div
      className={cn(
        "border-border/80 bg-muted/80 flex flex-col rounded-lg border p-2",
        "h-full",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 py-1.5 pr-2 pl-2">
        <div className="flex min-w-0 items-center gap-2">
          <Loader2Icon className="text-muted-foreground size-4 shrink-0 animate-spin" />
          <p className="text-muted-foreground truncate text-lg font-medium">
            Generating content...
          </p>
        </div>
        {source === "api" && (
          <Tooltip>
            <TooltipTrigger className="border-border/60 bg-background/80 text-muted-foreground hover:bg-background inline-flex shrink-0 items-center justify-center rounded-md border p-1 transition-colors">
              <BracesIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">Queued via API</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="border-border/80 bg-background flex-1 space-y-2 rounded-[0.75rem] border px-4 py-3">
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
