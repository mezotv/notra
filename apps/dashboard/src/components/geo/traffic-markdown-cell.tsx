"use client";

import { SourceCodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatMarkdownShare } from "@notra/geo-core/utils/ai-traffic";
import {
  HoverCard,
  HoverCardTrigger,
} from "@notra/ui/components/ui/hover-card";

import { TrafficBreakdownCard } from "@/components/geo/traffic-breakdown-card";
import { GEO_TRAFFIC_HOVER_DELAY_MS } from "@/constants/geo-traffic-hover";
import type { TrafficMarkdownCellProps } from "@/types/geo";

export function TrafficMarkdownCell({
  markdownVisits,
  visits,
}: TrafficMarkdownCellProps) {
  const share = formatMarkdownShare(markdownVisits, visits);

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={GEO_TRAFFIC_HOVER_DELAY_MS}
        render={
          <button
            aria-label={`${share} markdown, show details`}
            className="focus-visible:ring-ring/50 cursor-default rounded-sm tabular-nums outline-hidden focus-visible:ring-[3px]"
            type="button"
          />
        }
      >
        {share}
      </HoverCardTrigger>
      <TrafficBreakdownCard
        aside={share}
        icon={
          <HugeiconsIcon
            aria-hidden="true"
            className="size-4 shrink-0"
            icon={SourceCodeIcon}
            strokeWidth={2}
          />
        }
        title="Markdown"
      >
        <p className="text-muted-foreground px-3 py-1.5 text-xs text-pretty">
          <span className="text-foreground font-medium tabular-nums">
            {markdownVisits.toLocaleString()}
          </span>{" "}
          of{" "}
          <span className="text-foreground font-medium tabular-nums">
            {visits.toLocaleString()}
          </span>{" "}
          requests asked for markdown via the Accept header
        </p>
      </TrafficBreakdownCard>
    </HoverCard>
  );
}
