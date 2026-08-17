import type { Plan, PlanCacheStore } from "./types";

interface CacheEntry {
  plan: Plan;
  expiresAt: number;
}

/**
 * Process-local TTL cache for plan lookups. A pluggable `PlanCacheStore`
 * (e.g. Redis) can be layered on top by the caller.
 */
export function createMemoryPlanCache(
  now: () => number = () => Date.now()
): PlanCacheStore {
  const entries = new Map<string, CacheEntry>();

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
      return Promise.resolve(entry.plan);
    },
    set(organizationId, plan, ttlMs) {
      entries.set(organizationId, { plan, expiresAt: now() + ttlMs });
      return Promise.resolve();
    },
  };
}
