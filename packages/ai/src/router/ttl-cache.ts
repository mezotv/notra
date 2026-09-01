import type { TtlCacheEntry, TtlCacheStore } from "@notra/ai/types/router";

/**
 * Process-local TTL cache keyed by organization. A pluggable store (e.g.
 * Redis) can be layered on top by the caller.
 */
export function createMemoryTtlCache<T>(
  now: () => number = () => Date.now()
): TtlCacheStore<T> {
  const entries = new Map<string, TtlCacheEntry<T>>();

  return {
    get(organizationId) {
      const entry = entries.get(organizationId);
      if (!entry) {
        return Promise.resolve(undefined);
      }
      if (entry.expiresAt <= now()) {
        entries.delete(organizationId);
        return Promise.resolve(undefined);
      }
      return Promise.resolve(entry.value);
    },
    set(organizationId, value, ttlMs) {
      entries.set(organizationId, { value, expiresAt: now() + ttlMs });
      return Promise.resolve();
    },
  };
}
