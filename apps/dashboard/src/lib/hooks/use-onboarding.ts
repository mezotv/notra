"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/utils/query-keys";

interface OnboardingStatus {
  hasBrandIdentity: boolean;
  hasIntegration: boolean;
  hasSchedule: boolean;
  hasContent: boolean;
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

export function useDismissOnboarding(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/organizations/${organizationId}/onboarding`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dismissed: true }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to dismiss onboarding");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
      });
    },
  });
}
