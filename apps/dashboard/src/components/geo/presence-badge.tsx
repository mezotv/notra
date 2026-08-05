"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { GEO_PRESENCE_DOT_CLASSES, GEO_PRESENCE_LABELS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { GeoPresenceStatus } from "@/types/geo";

interface PresenceBadgeProps {
  status: GeoPresenceStatus | null;
}

const PRESENCE_TITLES: Record<string, string> = {
  "training-data":
    "Mentioned even without web access: you're in the model's training data",
  "retrieval-only":
    "Only mentioned when engines search the web: indexed, not memorized",
  invisible: "No engine mentions you on this prompt yet",
};

export function PresenceBadge({ status }: PresenceBadgeProps) {
  if (!status) {
    return null;
  }
  return (
    <Badge
      className="gap-1.5 whitespace-nowrap rounded-sm text-[0.6875rem] capitalize"
      title={PRESENCE_TITLES[status]}
      variant="outline"
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          GEO_PRESENCE_DOT_CLASSES[status]
        )}
      />
      {GEO_PRESENCE_LABELS[status]}
    </Badge>
  );
}
