"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import {
  AI_TRAFFIC_PURPOSE_DESCRIPTIONS,
  AI_TRAFFIC_PURPOSE_LABELS,
} from "@/constants/geo";

interface PurposeBadgeProps {
  category: string;
}

export function PurposeBadge({ category }: PurposeBadgeProps) {
  return (
    <Badge
      className="rounded-sm text-[0.6875rem] capitalize"
      title={AI_TRAFFIC_PURPOSE_DESCRIPTIONS[category] ?? category}
      variant="secondary"
    >
      {AI_TRAFFIC_PURPOSE_LABELS[category] ?? category}
    </Badge>
  );
}
