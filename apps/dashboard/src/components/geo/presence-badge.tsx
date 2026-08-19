"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { GEO_PRESENCE_LABELS } from "@/constants/geo";
import type { GeoPresenceStatus } from "@/types/geo";

interface PresenceBadgeProps {
  status: GeoPresenceStatus | null;
}

const PRESENCE_TITLES: Record<string, string> = {
  "training-data": "Mentioned in Memory: the model knows you without searching",
  "retrieval-only": "Mentioned in Search only: found live, not remembered",
  invisible: "No engine mentions you on this prompt yet",
};

export function PresenceBadge({ status }: PresenceBadgeProps) {
  if (!status) {
    return null;
  }
  return (
    <Badge
      className="whitespace-nowrap rounded-sm text-[0.6875rem]"
      title={PRESENCE_TITLES[status]}
      variant="outline"
    >
      {GEO_PRESENCE_LABELS[status]}
    </Badge>
  );
}
