import { createCached } from "@ai-sdk-tools/cache";
import { redis } from "@/lib/redis";
import type { CachedWrapper } from "@/types/lib/ai/tools";

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
}) {
  const orgPart = normalizeKeyPart(options?.organizationId ?? "anonymous");
  const namespacePart = normalizeKeyPart(options?.namespace ?? "default");
  const keyPrefix = `${DEFAULT_KEY_PREFIX}${namespacePart}:${orgPart}:`;

  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;

  const cached = redis
    ? createCached({
        cache: redis,
        keyPrefix,
        ttl,
      })
    : createCached({
        keyPrefix,
        ttl,
        debug: process.env.NODE_ENV === "development",
      });

  // NOTE: @ai-sdk-tools/cache currently vendors/peers against ai@5 types.
  // This app uses ai@6, so we intentionally treat the wrapper as structural.
  return cached as unknown as CachedWrapper;
}
