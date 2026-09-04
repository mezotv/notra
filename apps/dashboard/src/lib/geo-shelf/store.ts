import { db } from "@notra/db/drizzle";
import { geoShelfSources } from "@notra/db/schema";
import { and, desc, eq } from "drizzle-orm";

import { geoShelfSourceSchema } from "@/schemas/geo-shelf";
import type {
  GeoShelfSource,
  GeoShelfSourceList,
  GeoShelfStoreKey,
} from "@/types/geo-shelf";

type GeoShelfSourceRow = typeof geoShelfSources.$inferSelect;

function toSource(row: GeoShelfSourceRow): GeoShelfSource {
  return geoShelfSourceSchema.parse({
    id: row.id,
    url: row.url,
    domain: row.domain,
    title: row.title,
    kind: row.kind,
    ownership: row.ownership,
    origin: row.origin,
    fetchStatus: row.fetchStatus,
    lastFetchedAt: row.lastFetchedAt?.toISOString() ?? null,
    citations: row.citations,
    placements: row.placements,
    opportunity: row.opportunity,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toRow(source: GeoShelfSource, key: GeoShelfStoreKey) {
  return {
    id: source.id,
    organizationId: key.organizationId,
    projectId: key.projectId,
    url: source.url,
    domain: source.domain,
    title: source.title,
    kind: source.kind,
    ownership: source.ownership,
    origin: source.origin,
    fetchStatus: source.fetchStatus,
    lastFetchedAt: source.lastFetchedAt
      ? new Date(source.lastFetchedAt)
      : null,
    citations: source.citations,
    placements: source.placements,
    opportunity: source.opportunity,
    createdByUserId: source.createdByUserId,
    createdAt: new Date(source.createdAt),
    updatedAt: new Date(source.updatedAt),
  };
}

function scopeWhere(key: GeoShelfStoreKey) {
  return and(
    eq(geoShelfSources.organizationId, key.organizationId),
    eq(geoShelfSources.projectId, key.projectId)
  );
}

export async function readGeoShelfStore(
  key: GeoShelfStoreKey,
  seed: () => GeoShelfSource[]
): Promise<GeoShelfSourceList> {
  const rows = await db
    .select()
    .from(geoShelfSources)
    .where(scopeWhere(key))
    .orderBy(desc(geoShelfSources.updatedAt));
  if (rows.length > 0) {
    return { sources: rows.map(toSource), isSampleData: false };
  }
  const sources = seed();
  return { sources, isSampleData: sources.length > 0 };
}

export async function findGeoShelfSourceByUrl(
  key: GeoShelfStoreKey,
  seed: () => GeoShelfSource[],
  url: string
): Promise<GeoShelfSource | null> {
  const [row] = await db
    .select()
    .from(geoShelfSources)
    .where(and(scopeWhere(key), eq(geoShelfSources.url, url)))
    .limit(1);
  if (row) {
    return toSource(row);
  }
  return seed().find((candidate) => candidate.url === url) ?? null;
}

export async function insertGeoShelfSource(
  key: GeoShelfStoreKey,
  source: GeoShelfSource
): Promise<GeoShelfSource> {
  const [inserted] = await db
    .insert(geoShelfSources)
    .values(toRow(source, key))
    .returning();
  if (!inserted) {
    throw new Error("Failed to persist GEO shelf source");
  }
  return toSource(inserted);
}

export async function patchGeoShelfSource(
  key: GeoShelfStoreKey,
  seed: () => GeoShelfSource[],
  sourceId: string,
  update: (current: GeoShelfSource) => GeoShelfSource
): Promise<GeoShelfSource | null> {
  return await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(geoShelfSources)
      .where(and(scopeWhere(key), eq(geoShelfSources.id, sourceId)))
      .limit(1)
      .for("update");
    const current = row
      ? toSource(row)
      : (seed().find((candidate) => candidate.id === sourceId) ?? null);
    if (!current) {
      return null;
    }

    const next = geoShelfSourceSchema.parse(update(current));
    if (!row) {
      const [inserted] = await tx
        .insert(geoShelfSources)
        .values(toRow(next, key))
        .returning();
      return inserted ? toSource(inserted) : null;
    }

    const [updated] = await tx
      .update(geoShelfSources)
      .set(toRow(next, key))
      .where(and(scopeWhere(key), eq(geoShelfSources.id, sourceId)))
      .returning();
    return updated ? toSource(updated) : null;
  });
}
