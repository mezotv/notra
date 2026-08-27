"use client";

import { Robot01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@notra/ui/components/ui/hover-card";

import { EngineIcon } from "@/components/geo/engine-icon";
import { AI_TRAFFIC_PURPOSE_LABELS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type {
  TrafficSourceGroupCellProps,
  TrafficSourceGroupIconProps,
} from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import { trafficGroupShare } from "@/utils/ai-traffic-groups";
import { resolveEngineIconKey } from "@/utils/geo-engine-icon";

const HOVER_OPEN_DELAY_MS = 150;

function TrafficSourceGroupIcon({
  group,
  className,
}: TrafficSourceGroupIconProps) {
  if (group.icon === null) {
    return (
      <HugeiconsIcon
        aria-hidden="true"
        className={cn("text-muted-foreground size-4 shrink-0", className)}
        icon={Robot01Icon}
      />
    );
  }
  return <EngineIcon className={className} engine={group.icon} />;
}

export function TrafficSourceGroupCell({ group }: TrafficSourceGroupCellProps) {
  const label = (
    <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
      <TrafficSourceGroupIcon group={group} />
      <span className="truncate">{group.label}</span>
    </span>
  );

  if (group.visitorType !== "crawler") {
    return label;
  }

  const botCount = group.members.length;

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={HOVER_OPEN_DELAY_MS}
        render={
          <span className="flex max-w-full min-w-0 cursor-default items-center gap-2" />
        }
      >
        {label}
        <span className="text-muted-foreground shrink-0 text-[0.6875rem] tabular-nums">
          {botCount} {botCount === 1 ? "bot" : "bots"}
        </span>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80 p-0" side="bottom">
        <div className="border-border flex items-center justify-between gap-3 border-b px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <TrafficSourceGroupIcon group={group} />
            <span className="truncate">{group.label}</span>
          </span>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {group.visits.toLocaleString()} visits
          </span>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
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
                  {member.source}
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
                  {trafficGroupShare(member, group)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}
