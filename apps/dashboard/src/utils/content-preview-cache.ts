import { redis } from "@notra/ai/utils/redis";
import { after } from "next/server";
import {
  PREVIEW_CACHE_REFRESH_LOCK_TTL_SECONDS,
  PREVIEW_CACHE_STALE_AFTER_MS,
  PREVIEW_CACHE_TTL_SECONDS,
  PREVIEW_CACHE_VERSION,
} from "@/constants/content-preview-cache";
import type {
  PreviewCacheEntry,
  PreviewCacheKind,
  PreviewCacheSource,
} from "@/types/content/preview-cache";

const scheduledPreviewCacheRefreshKeys = new Set<string>();

function normalizeCacheKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getPreviewCacheKey(params: {
  kind: PreviewCacheKind;
  lookbackWindow: string;
  organizationId: string;
  source: PreviewCacheSource;
  sourceId: string;
}) {
  const orgPart = normalizeCacheKeyPart(params.organizationId);
  const sourceIdPart = normalizeCacheKeyPart(params.sourceId);
  const windowPart = normalizeCacheKeyPart(params.lookbackWindow);

  return [
    "notra",
    "content-preview",
    `v${PREVIEW_CACHE_VERSION}`,
    "org",
    orgPart,
    params.source,
    sourceIdPart,
    params.kind,
    windowPart,
  ].join(":");
}

function isPreviewCacheEntry<T extends unknown[]>(
  value: unknown
): value is PreviewCacheEntry<T> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<PreviewCacheEntry<T>>;

  return (
    entry.version === PREVIEW_CACHE_VERSION &&
    typeof entry.fetchedAt === "number" &&
    typeof entry.staleAt === "number" &&
    Array.isArray(entry.data)
  );
}

async function writePreviewCache<T extends unknown[]>(key: string, data: T) {
  if (!redis) {
    return;
  }

  const now = Date.now();
  const entry: PreviewCacheEntry<T> = {
    version: PREVIEW_CACHE_VERSION,
    fetchedAt: now,
    staleAt: now + PREVIEW_CACHE_STALE_AFTER_MS,
    data,
  };

  await redis.set(key, entry, { ex: PREVIEW_CACHE_TTL_SECONDS });
}

async function tryAcquirePreviewCacheRefreshLock(cacheKey: string) {
  if (!redis) {
    return false;
  }

  const lockKey = `${cacheKey}:refresh-lock`;
  const result = await redis.set(lockKey, "1", {
    ex: PREVIEW_CACHE_REFRESH_LOCK_TTL_SECONDS,
    nx: true,
  });

  return result === "OK";
}

function schedulePreviewCacheRefresh<T extends unknown[]>(params: {
  cacheKey: string;
  fetchFresh: () => Promise<T>;
}) {
  if (scheduledPreviewCacheRefreshKeys.has(params.cacheKey)) {
    return;
  }

  scheduledPreviewCacheRefreshKeys.add(params.cacheKey);

  try {
    after(async () => {
      try {
        const acquired = await tryAcquirePreviewCacheRefreshLock(
          params.cacheKey
        );

        if (!acquired) {
          return;
        }

        const fresh = await params.fetchFresh();
        await writePreviewCache(params.cacheKey, fresh);
      } catch (error) {
        console.warn(
          `[Preview] Failed to refresh stale preview cache entry ${params.cacheKey}:`,
          error
        );
      } finally {
        scheduledPreviewCacheRefreshKeys.delete(params.cacheKey);
      }
    });
  } catch (error) {
    scheduledPreviewCacheRefreshKeys.delete(params.cacheKey);
    console.warn(
      `[Preview] Failed to schedule stale preview cache refresh ${params.cacheKey}:`,
      error
    );
  }
}

export async function getCachedPreviewData<T extends unknown[]>(params: {
  cacheKey: string;
  fetchFresh: () => Promise<T>;
}) {
  if (!redis) {
    return params.fetchFresh();
  }

  try {
    const cached = await redis.get<PreviewCacheEntry<T>>(params.cacheKey);

    if (isPreviewCacheEntry<T>(cached)) {
      if (cached.staleAt <= Date.now()) {
        schedulePreviewCacheRefresh(params);
      }

      return cached.data;
    }
  } catch (error) {
    console.warn(
      `[Preview] Failed to read preview cache entry ${params.cacheKey}:`,
      error
    );
  }

  const fresh = await params.fetchFresh();

  try {
    await writePreviewCache(params.cacheKey, fresh);
  } catch (error) {
    console.warn(
      `[Preview] Failed to write preview cache entry ${params.cacheKey}:`,
      error
    );
  }

  return fresh;
}
