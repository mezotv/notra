"use client";

import {
  Globe02Icon,
  QuotesIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  AI_TRAFFIC_PURPOSE_DESCRIPTIONS,
  AI_TRAFFIC_PURPOSE_LABELS,
} from "@/constants/geo";
import type { PurposeBadgeProps } from "@/types/geo";

const PURPOSE_ICONS: Record<string, typeof QuotesIcon> = {
  "assistant-browse": QuotesIcon,
  "training-crawler": Globe02Icon,
  "search-index": Search01Icon,
};

export function PurposeBadge({ category }: PurposeBadgeProps) {
  const icon = PURPOSE_ICONS[category];
  const label = AI_TRAFFIC_PURPOSE_LABELS[category] ?? category;

  return (
    <Badge
      className="gap-1 rounded-sm text-[0.6875rem]"
      title={AI_TRAFFIC_PURPOSE_DESCRIPTIONS[category] ?? category}
      variant="secondary"
    >
      {icon ? (
        <HugeiconsIcon
          className="size-3 shrink-0"
          icon={icon}
          strokeWidth={2}
        />
      ) : null}
      {label}
    </Badge>
  );
}
