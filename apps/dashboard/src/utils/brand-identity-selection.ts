"use client";

import { localStorageKeys } from "@/constants/storage";
import type { BrandSettings } from "@/types/hooks/brand-analysis";

export function findSelectedBrandIdentity(
  voices: BrandSettings[],
  voiceId: string | null,
  storedVoiceId: string | null
): BrandSettings | undefined {
  return (
    (voiceId ? voices.find((voice) => voice.id === voiceId) : undefined) ??
    (storedVoiceId
      ? voices.find((voice) => voice.id === storedVoiceId)
      : undefined) ??
    voices.find((voice) => voice.isDefault) ??
    voices[0]
  );
}

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
