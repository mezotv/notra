"use client";

import { localStorageKeys } from "@/constants/storage";

export function readStoredBrandIdentityId(
  organizationId: string
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(
      localStorageKeys.brandIdentity(organizationId)
    );
  } catch {
    return null;
  }
}

export function writeStoredBrandIdentityId(
  organizationId: string,
  voiceId: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      localStorageKeys.brandIdentity(organizationId),
      voiceId
    );
  } catch {
    return;
  }
}
