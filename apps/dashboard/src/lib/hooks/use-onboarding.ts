"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/utils/query-keys";

interface OnboardingStatus {
  hasBrandIdentity: boolean;
  hasIntegration: boolean;
  hasSchedule: boolean;
  onboardingCompleted: boolean;
  onboardingDismissed: boolean;
}

export function useOnboardingStatus(organizationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
    queryFn: async (): Promise<OnboardingStatus> => {
      const res = await fetch(
        `/api/organizations/${organizationId}/onboarding`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch onboarding status");
      }
      return res.json();
    },
    enabled: !!organizationId,
  });
}
