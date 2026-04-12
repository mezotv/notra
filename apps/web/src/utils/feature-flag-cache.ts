"use client";

import { useFlag } from "@databuddy/sdk/react";
import { useEffect, useState } from "react";
import { z } from "zod";

const STORAGE_PREFIX = "notra_ff_";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const cacheEntrySchema = z.object({
  cachedAt: z.number(),
  on: z.boolean(),
  value: z.union([z.boolean(), z.string(), z.number()]).optional(),
  variant: z.string().optional(),
});

type CachedFlag = {
  on: boolean;
  value: boolean | string | number | undefined;
  variant: string | undefined;
};

type CachedEntry = { key: string; flag: CachedFlag };

type CachedFlagState = {
  on: boolean;
  status: "loading" | "ready" | "error" | "pending";
  loading: boolean;
  value: boolean | string | number | undefined;
  variant: string | undefined;
};

function readCache(key: string): CachedFlag | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      return null;
    }

    const result = cacheEntrySchema.safeParse(JSON.parse(raw));

    if (!result.success) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }

    if (Date.now() - result.data.cachedAt > CACHE_TTL_MS) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }

    return {
      on: result.data.on,
      value: result.data.value,
      variant: result.data.variant,
    };
  } catch {
    return null;
  }
}

function writeCache(key: string, flag: CachedFlag): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const entry = { ...flag, cachedAt: Date.now() };
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    return;
  }
}

export function clearCachedFlag(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    return;
  }
}

export function useCachedFlag(key: string): CachedFlagState {
  const flag = useFlag(key);
  const [cachedEntry, setCachedEntry] = useState<CachedEntry | null>(null);

  useEffect(() => {
    const value = readCache(key);
    setCachedEntry(value ? { key, flag: value } : null);
  }, [key]);

  useEffect(() => {
    if (flag.status !== "ready") {
      return;
    }

    const next: CachedFlag = {
      on: flag.on,
      value: flag.value,
      variant: flag.variant,
    };

    writeCache(key, next);
    setCachedEntry({ key, flag: next });
  }, [key, flag.status, flag.on, flag.value, flag.variant]);

  if (flag.status === "ready") {
    return {
      on: flag.on,
      status: "ready",
      loading: false,
      value: flag.value,
      variant: flag.variant,
    };
  }

  const cached = cachedEntry?.key === key ? cachedEntry.flag : null;

  if (cached) {
    return {
      on: cached.on,
      status: "ready",
      loading: false,
      value: cached.value,
      variant: cached.variant,
    };
  }

  return {
    on: flag.on,
    status: flag.status,
    loading: flag.loading,
    value: flag.value,
    variant: flag.variant,
  };
}
