"use client";

import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { useEffect, useRef } from "react";

import { trackEvent } from "@/lib/analytics/posthog-client";
import type { OnboardingStepViewTrackerProps } from "@/types/analytics/events";

export function OnboardingStepViewTracker({
  step,
  isResuming = false,
  inOnboardingFlow = true,
}: OnboardingStepViewTrackerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) {
      return;
    }
    firedRef.current = true;
    trackEvent(POSTHOG_EVENTS.ONBOARDING_STEP_VIEWED, {
      step,
      is_resuming: isResuming,
      in_onboarding_flow: inOnboardingFlow,
    });
  }, [step, isResuming, inOnboardingFlow]);

  return null;
}
