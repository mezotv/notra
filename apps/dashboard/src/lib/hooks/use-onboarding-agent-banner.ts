"use client";

import { useEffect, useState } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { EVE_BANNER_DEBUG_PARAM } from "@/constants/onboarding-agent";
import type { OnboardingAgentBannerState } from "@/types/hooks/onboarding";
import { useOnboardingAgentRun } from "./use-onboarding";

export function useOnboardingAgentBanner(): OnboardingAgentBannerState {
  const { activeOrganization } = useOrganizationsContext();
  const [debugParam, setDebugParam] = useState(false);
  const { data } = useOnboardingAgentRun(activeOrganization?.id ?? "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebugParam(params.get(EVE_BANNER_DEBUG_PARAM) === "1");
  }, []);

  const running = data?.running ?? false;

  return {
    visible: running || debugParam,
    debug: debugParam && !running,
  };
}
