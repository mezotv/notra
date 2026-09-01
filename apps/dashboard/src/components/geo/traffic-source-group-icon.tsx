"use client";

import { Robot01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { EngineIcon } from "@/components/geo/engine-icon";
import { cn } from "@/lib/utils";
import type { TrafficSourceGroupIconProps } from "@/types/geo";

export function TrafficSourceGroupIcon({
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
