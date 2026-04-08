"use client";

import { track } from "@databuddy/sdk/react";
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import {
  DATABUDDY_SIGNUP_STARTED_EVENT,
  getLandingPageH1Copy,
  LANDING_PAGE_H1_EXPERIMENT_KEY,
  normalizeLandingPageH1Variant,
  serializeSignupAttribution,
} from "@/utils/databuddy";
import { useCachedFlag } from "@/utils/feature-flag-cache";

const DEFAULT_SIGNUP_URL = "https://app.usenotra.com/signup";

function buildTrackedSignupHref(
  href: string,
  source: string,
  variant: string | undefined
): string {
  const normalizedVariant = normalizeLandingPageH1Variant(variant);
  return serializeSignupAttribution(new URL(href, DEFAULT_SIGNUP_URL), {
    landingPageH1Copy: getLandingPageH1Copy(normalizedVariant),
    landingPageH1Variant: normalizedVariant,
    source,
  });
}

type TrackedSignupLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  children?: React.ReactNode;
  href?: string;
  source: string;
};

export function TrackedSignupLink({
  children,
  href = DEFAULT_SIGNUP_URL,
  onClick,
  source,
  ...props
}: TrackedSignupLinkProps) {
  const { variant } = useCachedFlag(LANDING_PAGE_H1_EXPERIMENT_KEY);
  const trackedHref = buildTrackedSignupHref(href, source, variant);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    track(DATABUDDY_SIGNUP_STARTED_EVENT, {
      destination: trackedHref,
      landing_page_h1_copy: getLandingPageH1Copy(variant),
      landing_page_h1_variant: normalizeLandingPageH1Variant(variant),
      source,
    });
  }

  return (
    <Link href={trackedHref} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
