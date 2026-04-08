"use client";

import { useFlag } from "@databuddy/sdk/react";
import { useEffect, useState } from "react";

const STORAGE_PREFIX = "notra_ff_";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

type FlagValue = boolean | string | number | undefined;

type CachedFlag = {
  on: boolean;
  value: FlagValue;
  variant: string | undefined;
};

type CacheEntry = CachedFlag & { cachedAt: number };

type CachedFlagState = {
  on: boolean;
  status: "loading" | "ready" | "error" | "pending";
  loading: boolean;
  value: FlagValue;
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

    const parsed = JSON.parse(raw) as CacheEntry;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.cachedAt !== "number"
    ) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }

    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }

    return { on: parsed.on, value: parsed.value, variant: parsed.variant };
  } catch {
    return null;
  }
}

function writeCache(key: string, flag: CachedFlag): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const entry: CacheEntry = { ...flag, cachedAt: Date.now() };
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
  const [cached, setCached] = useState<CachedFlag | null>(null);

  useEffect(() => {
    setCached(readCache(key));
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
    setCached(next);
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
