"use client";

import { track } from "@databuddy/sdk/react";
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import {
  DATABUDDY_SIGNUP_STARTED_EVENT,
  serializeSignupAttribution,
} from "@/utils/databuddy";

const DEFAULT_SIGNUP_URL = "https://app.usenotra.com/signup";

function buildTrackedSignupHref(href: string, source: string): string {
  return serializeSignupAttribution(new URL(href, DEFAULT_SIGNUP_URL), {
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
  const trackedHref = buildTrackedSignupHref(href, source);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    track(DATABUDDY_SIGNUP_STARTED_EVENT, {
      destination: trackedHref,
      source,
    });
  }

  return (
    <Link href={trackedHref} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
