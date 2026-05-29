import type { CachedWrapper } from "@notra/ai/types/tools";
import type { Redis } from "@upstash/redis";

interface ExecutableTool {
  execute?: (params: unknown, context?: unknown) => Promise<unknown> | unknown;
}

interface MemoryCacheEntry {
  expiresAt: number;
  value: unknown;
}

interface RedisCacheEnvelope {
  __notraToolCache: true;
  value: unknown;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

function normalizeKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parsePositiveInt(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const DEFAULT_TTL_MS =
  parsePositiveInt(process.env.AI_TOOLS_CACHE_TTL_MS) ?? 5 * 60 * 1000;

const DEFAULT_KEY_PREFIX =
  process.env.AI_TOOLS_CACHE_KEY_PREFIX ?? "notra:ai-tools:";

export function getAICachedTools(options?: {
  organizationId?: string;
  namespace?: string;
  ttlMs?: number;
  redis?: Redis | null;
}) {
  const orgPart = normalizeKeyPart(options?.organizationId ?? "anonymous");
  const namespacePart = normalizeKeyPart(options?.namespace ?? "default");
  const keyPrefix = `${DEFAULT_KEY_PREFIX}${namespacePart}:${orgPart}:`;

  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;

  const redis = options?.redis;
  const debug = process.env.NODE_ENV === "development";

  return ((tool: ExecutableTool, cacheOptions = {}) => {
    if (typeof tool.execute !== "function") {
      return tool;
    }

    const originalExecute = tool.execute;
    const toolTtl = cacheOptions.ttl ?? ttl;
    return {
      ...tool,
      execute: async (params: unknown, context?: unknown) => {
        const cacheKey = `${keyPrefix}${cacheOptions.keyGenerator?.(params, context) ?? createDefaultCacheKey(params)}`;
        const cachedValue = await readCachedValue(cacheKey, redis);
        if (cachedValue.hit) {
          if (cacheOptions.debug ?? debug) {
            console.debug("[ai-tool-cache] hit", cacheKey);
          }
          return cachedValue.value;
        }

        const result = await originalExecute(params, context);
        if (cacheOptions.shouldCache?.(params, result) === false) {
          return result;
        }

        await writeCachedValue(cacheKey, result, toolTtl, redis);
        return result;
      },
    };
  }) as CachedWrapper;
}

function createDefaultCacheKey(params: unknown) {
  return JSON.stringify(params ?? {});
}

async function readCachedValue(
  key: string,
  redis?: Redis | null
): Promise<{ hit: true; value: unknown } | { hit: false }> {
  if (redis) {
    const value = await redis.get<unknown>(key);
    if (isRedisCacheEnvelope(value)) {
      return { hit: true, value: value.value };
    }

    return value === null ? { hit: false } : { hit: true, value };
  }

  const entry = memoryCache.get(key);
  if (!entry) {
    return { hit: false };
  }

  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return { hit: false };
  }

  return { hit: true, value: entry.value };
}

async function writeCachedValue(
  key: string,
  value: unknown,
  ttlMs: number,
  redis?: Redis | null
) {
  if (redis) {
    await redis.set(key, createRedisCacheEnvelope(value), {
      ex: Math.ceil(ttlMs / 1000),
    });
    return;
  }

  pruneExpiredMemoryCacheEntries();
  memoryCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value,
  });
}

function createRedisCacheEnvelope(value: unknown): RedisCacheEnvelope {
  return {
    __notraToolCache: true,
    value,
  };
}

function isRedisCacheEnvelope(value: unknown): value is RedisCacheEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "__notraToolCache" in value &&
    value.__notraToolCache === true &&
    "value" in value
  );
}

function pruneExpiredMemoryCacheEntries() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}
