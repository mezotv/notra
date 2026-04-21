"use client";

import { useFlag } from "@databuddy/sdk/react";
import { useCallback, useEffect, useSyncExternalStore } from "react";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

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

type CachedFlagState = {
  on: boolean;
  status: "loading" | "ready" | "error" | "pending";
  loading: boolean;
  value: boolean | string | number | undefined;
  variant: string | undefined;
};

export function getStorageKey(key: string): string {
  return STORAGE_PREFIX + key;
}

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

// Memoized cache reader for useSyncExternalStore. The hook requires snapshot
// references to be stable across calls (returning a new object every read causes
// infinite re-renders), so we cache the parsed entry per key and only return a
// new reference when the underlying localStorage value changes.
const snapshotCache = new Map<
  string,
  { raw: string | null; parsed: CachedFlag | null }
>();

function readCachedSnapshot(key: string): CachedFlag | null {
  if (typeof window === "undefined") {
    return null;
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }

  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) {
    return cached.parsed;
  }

  const parsed = readCache(key);
  snapshotCache.set(key, { raw, parsed });
  return parsed;
}

function getServerSnapshot(): CachedFlag | null {
  return null;
}

export function useCachedFlag(key: string): CachedFlagState {
  const flag = useFlag(key);

  // Stable subscribe/getSnapshot functions for useSyncExternalStore — both
  // need referential stability across renders or the store will resubscribe
  // on every render.
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window === "undefined") {
        return () => {
          return;
        };
      }

      const storageKey = STORAGE_PREFIX + key;
      function handleStorage(event: StorageEvent) {
        if (event.key === storageKey || event.key === null) {
          notify();
        }
      }

      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    },
    [key]
  );

  const getSnapshot = useCallback(() => readCachedSnapshot(key), [key]);

  // Read localStorage synchronously on every render so the first client render
  // matches what's cached. This eliminates the flash from SSR default → cached
  // value that previously happened in a useEffect after mount.
  const cached = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (flag.status !== "ready") {
      return;
    }

    writeCache(key, {
      on: flag.on,
      value: flag.value,
      variant: flag.variant,
    });
    // Invalidate snapshot cache so subsequent reads pick up the fresh value.
    snapshotCache.delete(key);
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
