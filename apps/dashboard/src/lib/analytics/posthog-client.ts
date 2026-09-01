"use client";

import type { PostHogEventName } from "@notra/posthog/events";
import type { PostHogProperties } from "@notra/posthog/types/posthog";
import posthog from "posthog-js";

import { POSTHOG_PROJECT_TOKEN } from "@/constants/posthog";

export function trackEvent(
  event: PostHogEventName,
  properties?: PostHogProperties
): void {
  if (!POSTHOG_PROJECT_TOKEN) {
    return;
  }
  posthog.capture(event, properties);
}

export function trackClientException(
  error: unknown,
  properties?: PostHogProperties
): void {
  if (!POSTHOG_PROJECT_TOKEN) {
    return;
  }
  posthog.captureException(error, properties);
}
