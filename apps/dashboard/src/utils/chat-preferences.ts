"use client";

import {
  chatModelSchema,
  storedChatPreferencesSchema,
  thinkingLevelSchema,
} from "@notra/ai/schemas/chat";
import type { StoredChatPreferences } from "@notra/ai/types/chat";

const CHAT_PREFERENCES_STORAGE_VERSION = "v1";

export const CHAT_PREFERENCES_STORAGE_KEY = `notra_chat_preferences:${CHAT_PREFERENCES_STORAGE_VERSION}`;

export const DEFAULT_CHAT_PREFERENCES: StoredChatPreferences = {
  model: "auto",
  thinkingLevel: "medium",
};

function clearStoredChatPreferences(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(CHAT_PREFERENCES_STORAGE_KEY);
  } catch {
    // Ignore storage access failures.
  }
}

export function parseStoredChatModel(
  value: string
): StoredChatPreferences["model"] | null {
  const result = chatModelSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function parseStoredThinkingLevel(
  value: string
): StoredChatPreferences["thinkingLevel"] | null {
  const result = thinkingLevelSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function readStoredChatPreferences(): StoredChatPreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CHAT_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const result = storedChatPreferencesSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      clearStoredChatPreferences();
      return null;
    }

    return result.data;
  } catch {
    clearStoredChatPreferences();
    return null;
  }
}

export function writeStoredChatPreferences(
  preferences: StoredChatPreferences
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CHAT_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences)
    );
  } catch {
    // Ignore quota exceeded and other storage errors.
  }
}
