"use client";

import { useFlag } from "@databuddy/sdk/react";
import { useEffect } from "react";
import { getFeatureFlagCookieName } from "./feature-flag-keys";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function writeFlagCookie(key: string, variant: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const name = getFeatureFlagCookieName(key);
  const value = encodeURIComponent(variant);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function useStickyFlag(
  key: string,
  initialVariant: string | undefined
): string | undefined {
  const flag = useFlag(key);

  useEffect(() => {
    if (flag.status === "ready" && flag.variant) {
      writeFlagCookie(key, flag.variant);
    }
  }, [key, flag.status, flag.variant]);

  if (flag.status === "ready") {
    return flag.variant;
  }

  return initialVariant;
}
