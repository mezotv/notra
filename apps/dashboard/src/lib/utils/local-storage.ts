"use client";

import { useEffect, useState } from "react";

function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const stored = localStorage.getItem(key);
    if (stored == null) {
      return defaultValue;
    }
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota exceeded and other storage errors
  }
}

/**
 * Persist state in localStorage. Uses lazy initialization to avoid SSR issues.
 * Values are JSON-serialized; use primitive types or plain objects.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() =>
    getStoredValue(key, defaultValue)
  );

  useEffect(() => {
    setStoredValue(key, value);
  }, [key, value]);

  return [value, setValue];
}

export { getStoredValue, setStoredValue };
