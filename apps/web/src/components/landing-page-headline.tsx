"use client";

import { getLandingPageH1Copy } from "@/utils/databuddy";
import { LANDING_PAGE_H1_EXPERIMENT_KEY } from "@/utils/feature-flag-keys";
import { useStickyFlag } from "@/utils/use-sticky-flag";

export function LandingPageHeadline({
  className,
  initialVariant,
}: {
  className?: string;
  initialVariant?: string;
}) {
  const variant = useStickyFlag(LANDING_PAGE_H1_EXPERIMENT_KEY, initialVariant);

  return <h1 className={className}>{getLandingPageH1Copy(variant)}</h1>;
}
