"use client";

import { useQuery } from "@tanstack/react-query";
import type { OnboardingStatus } from "@/types/hooks/onboarding";
import { dashboardOrpc } from "../orpc/query";

export function useOnboardingStatus(organizationId: string) {
  return useQuery<OnboardingStatus>(
    dashboardOrpc.onboarding.get.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
}
