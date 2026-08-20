"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { GEO_PRESENCE_LABELS } from "@/constants/geo";
import type { GeoPresenceStatus, PresenceBadgeProps } from "@/types/geo";

const PRESENCE_TITLES: Partial<Record<GeoPresenceStatus, string>> = {
  "retrieval-only": "Mentioned in Search only: found live, not in the model",
  invisible: "No engine mentions you on this prompt yet",
};

export function PresenceBadge({ status }: PresenceBadgeProps) {
  if (!status || status === "training-data") {
    return null;
  }
  const label = GEO_PRESENCE_LABELS[status];
  if (!label) {
    return null;
  }
  return (
    <Badge
      className="whitespace-nowrap rounded-sm text-[0.6875rem]"
      title={PRESENCE_TITLES[status]}
      variant="outline"
    >
      {label}
    </Badge>
  );
}
