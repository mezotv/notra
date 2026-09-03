import type { RouterTransitionType } from "next";

import {
  initializePostHogWhenIdle,
  notePostHogNavigation,
  observePostHogHistory,
} from "@/lib/analytics/posthog-client";

observePostHogHistory();
initializePostHogWhenIdle();

export function onRouterTransitionStart(
  url: string,
  navigationType: RouterTransitionType
): void {
  notePostHogNavigation(url, navigationType);
}
