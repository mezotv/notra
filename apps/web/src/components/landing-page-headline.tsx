"use client";

import {
  getLandingPageH1Copy,
  LANDING_PAGE_H1_EXPERIMENT_KEY,
} from "@/utils/databuddy";
import { useCachedFlag } from "@/utils/feature-flag-cache";

export function LandingPageHeadline({ className }: { className?: string }) {
  const { variant } = useCachedFlag(LANDING_PAGE_H1_EXPERIMENT_KEY);

  return <h1 className={className}>{getLandingPageH1Copy(variant)}</h1>;
}
