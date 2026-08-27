import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { eq, sql } from "drizzle-orm";

import {
  GEO_INGEST_IDENTITY_ACTIVE_TTL_SECONDS,
  GEO_INGEST_IDENTITY_INACTIVE_TTL_SECONDS,
  GEO_INGEST_TOKEN_GENERATION_CACHE_PREFIX,
} from "@/constants/geo";

const MISSING = "missing";

function generationCacheKey(organizationId: string): string {
  return `${GEO_INGEST_TOKEN_GENERATION_CACHE_PREFIX}:${organizationId}`;
}

async function cacheGeneration(
  organizationId: string,
  value: number | null
): Promise<void> {
  const client = redis;
  if (!client) {
    return;
  }
  await client
    .set(generationCacheKey(organizationId), value === null ? MISSING : value, {
      ex:
        value === null
          ? GEO_INGEST_IDENTITY_INACTIVE_TTL_SECONDS
          : GEO_INGEST_IDENTITY_ACTIVE_TTL_SECONDS,
    })
    .catch(() => null);
}

/**
 * The organization's current tracking-token generation, or null when the
 * organization no longer exists. Cached briefly; rotation writes through the
 * cache so revocation takes effect immediately.
 */
export async function getGeoIngestTokenGeneration(
  organizationId: string
): Promise<number | null> {
  const client = redis;
  if (client) {
    const cached = await client
      .get<string | number>(generationCacheKey(organizationId))
      .catch(() => null);
    if (cached === MISSING) {
      return null;
    }
    const parsed = typeof cached === "number" ? cached : Number(cached);
    if (Number.isInteger(parsed) && parsed >= 1) {
      return parsed;
    }
  }

  const row = await db.query.organizations.findFirst({
    columns: { geoIngestTokenGeneration: true },
    where: eq(organizations.id, organizationId),
  });
  const generation = row?.geoIngestTokenGeneration ?? null;
  await cacheGeneration(organizationId, generation);
  return generation;
}

/**
 * Revoke every outstanding tracking token for the organization by bumping the
 * generation. Returns the new generation.
 */
export async function rotateGeoIngestTokenGeneration(
  organizationId: string
): Promise<number | null> {
  const [row] = await db
    .update(organizations)
    .set({
      geoIngestTokenGeneration: sql`${organizations.geoIngestTokenGeneration} + 1`,
    })
    .where(eq(organizations.id, organizationId))
    .returning({ generation: organizations.geoIngestTokenGeneration });
  if (!row) {
    return null;
  }
  await cacheGeneration(organizationId, row.generation);
  return row.generation;
}
