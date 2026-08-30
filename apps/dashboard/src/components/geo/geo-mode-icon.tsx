"use client";

import {
  AiBrain01Icon,
  Search01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { GeoSparklineMode } from "@notra/geo-core/types/geo";

import { cn } from "@/lib/utils";
import type { GeoModeIconProps } from "@/types/geo";

const MODE_ICON = {
  all: ViewIcon,
  search: Search01Icon,
  memory: AiBrain01Icon,
} as const;

const MODE_COLOR_CLASS: Record<GeoSparklineMode, string> = {
  all: "text-foreground",
  search: "text-geo-search",
  memory: "text-geo-memory",
};

export function GeoModeIcon({ mode, className }: GeoModeIconProps) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      className={cn("size-3.5 shrink-0", MODE_COLOR_CLASS[mode], className)}
      icon={MODE_ICON[mode]}
    />
  );
}
