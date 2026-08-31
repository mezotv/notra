"use client";

import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { useEffect, useRef } from "react";

import { trackEvent } from "@/lib/analytics/posthog-client";
import type { LoginErrorTrackerProps } from "@/types/analytics/events";

export function LoginErrorTracker({ errorCode }: LoginErrorTrackerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) {
      return;
    }
    firedRef.current = true;
    trackEvent(POSTHOG_EVENTS.LOGIN_FAILED, { error_code: errorCode });
  }, [errorCode]);

  return null;
}
