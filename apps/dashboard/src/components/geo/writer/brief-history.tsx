"use client";

import type { GeoContentBriefStatus } from "@notra/db/types/geo-writer";
import { Badge } from "@notra/ui/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BriefHistoryProps } from "@/types/components/geo-writer";

const STATUS_LABELS: Record<GeoContentBriefStatus, string> = {
  draft: "Draft plan",
  approved: "Queued",
  writing: "Writing",
  completed: "Done",
  failed: "Failed",
};

function statusVariant(
  status: GeoContentBriefStatus
): "secondary" | "destructive" | "outline" {
  if (status === "completed") {
    return "secondary";
  }
  if (status === "failed") {
    return "destructive";
  }
  return "outline";
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

export function BriefHistory({
  briefs,
  activeBriefId,
  onOpen,
}: BriefHistoryProps) {
  if (briefs.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="px-1 font-medium text-muted-foreground text-xs">Recent</h2>
      <ul className="divide-y divide-border border-y">
        {briefs.map((brief) => (
          <li key={brief.id}>
            <button
              className={cn(
                "flex w-full items-center justify-between gap-3 px-1 py-2.5 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                activeBriefId && brief.id === activeBriefId && "bg-muted/40"
              )}
              onClick={() => onOpen(brief.id)}
              type="button"
            >
              <span className="min-w-0 flex-1 truncate">
                {brief.workingTitle || brief.topic}
              </span>
              <span className="shrink-0 text-muted-foreground text-xs">
                {dateFormatter.format(new Date(brief.createdAt))}
              </span>
              <Badge className="shrink-0" variant={statusVariant(brief.status)}>
                {STATUS_LABELS[brief.status]}
              </Badge>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
