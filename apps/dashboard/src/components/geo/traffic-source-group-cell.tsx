"use client";

import {
  HoverCard,
  HoverCardTrigger,
} from "@notra/ui/components/ui/hover-card";

import { TrafficBreakdownCard } from "@/components/geo/traffic-breakdown-card";
import { TrafficSourceGroupIcon } from "@/components/geo/traffic-source-group-icon";
import { AI_TRAFFIC_PURPOSE_LABELS } from "@/constants/geo";
import { GEO_TRAFFIC_HOVER_DELAY_MS } from "@/constants/geo-traffic-hover";
import type { TrafficSourceGroupCellProps } from "@/types/geo";
import { formatAiTrafficTimestamp, formatGeoSource } from "@/utils/ai-traffic";
import {
  hasTrafficGroupBreakdown,
  trafficVisitShare,
} from "@/utils/ai-traffic-groups";
import { resolveEngineIconKey } from "@/utils/geo-engine-icon";

export function TrafficSourceGroupCell({ group }: TrafficSourceGroupCellProps) {
  const label = (
    <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
      <TrafficSourceGroupIcon group={group} />
      <span className="truncate">{group.label}</span>
    </span>
  );

  if (!hasTrafficGroupBreakdown(group)) {
    return label;
  }

  const botCount = group.members.length;
  const noun = group.visitorType === "crawler" ? "bot" : "source";
  const botsLabel = `${botCount} ${botCount === 1 ? noun : `${noun}s`}`;

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={GEO_TRAFFIC_HOVER_DELAY_MS}
        render={
          <button
            aria-label={`${group.label}: ${botsLabel}, show breakdown`}
            className="focus-visible:ring-ring/50 flex max-w-full min-w-0 cursor-default items-center gap-2 rounded-sm text-left outline-hidden focus-visible:ring-[3px]"
            type="button"
          />
        }
      >
        {label}
        <span className="text-muted-foreground shrink-0 text-[0.6875rem] tabular-nums">
          {botsLabel}
        </span>
      </HoverCardTrigger>
      <TrafficBreakdownCard
        aside={`${group.visits.toLocaleString()} visits`}
        icon={<TrafficSourceGroupIcon group={group} />}
        title={group.label}
      >
        <ul>
          {group.members.map((member) => (
            <li
              className="flex items-center gap-2 px-3 py-1.5"
              key={member.source}
            >
              <TrafficSourceGroupIcon
                className="size-3.5"
                group={{
                  key: member.source,
                  label: member.source,
                  icon: resolveEngineIconKey(member.source)
                    ? member.source
                    : null,
                }}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium">
                  {formatGeoSource(member.source, member.visitorType)}
                </span>
                <span className="text-muted-foreground flex gap-2 text-[0.6875rem]">
                  <span className="truncate">
                    {AI_TRAFFIC_PURPOSE_LABELS[member.category] ??
                      member.category}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatAiTrafficTimestamp(member.lastSeenAt)}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-xs font-medium tabular-nums">
                  {member.visits.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-[0.6875rem] tabular-nums">
                  {trafficVisitShare(member.visits, group.visits)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </TrafficBreakdownCard>
    </HoverCard>
  );
}
