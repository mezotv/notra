"use client";

import { useAnalyticsContext } from "@/components/analytics/analytics-context";
import { LeaderboardCard } from "@/components/analytics/leaderboard-card";

export default function LeaderboardPageClient() {
  const { organizationId, organizationSlug } = useAnalyticsContext();

  return (
    <LeaderboardCard
      organizationId={organizationId}
      organizationSlug={organizationSlug}
      variant="page"
    />
  );
}
