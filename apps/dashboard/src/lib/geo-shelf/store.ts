import type { GeoShelfSource, GeoShelfStoreKey } from "@/types/geo-shelf";

const stores = new Map<string, GeoShelfSource[]>();
const sampleSeededStores = new Set<string>();

function storeId(key: GeoShelfStoreKey): string {
  return `${key.organizationId}:${key.projectId}`;
}

export function readGeoShelfStore(
  key: GeoShelfStoreKey,
  seed: () => GeoShelfSource[]
): GeoShelfSource[] {
  const id = storeId(key);
  const existing = stores.get(id);
  if (existing) {
    return existing;
  }
  const seeded = seed();
  stores.set(id, seeded);
  if (seeded.length > 0) {
    sampleSeededStores.add(id);
  }
  return seeded;
}

/** True when the bucket was populated from the local fixture instead of real data. */
export function isGeoShelfStoreSampleSeeded(key: GeoShelfStoreKey): boolean {
  return sampleSeededStores.has(storeId(key));
}

export function findGeoShelfSourceByUrl(
  key: GeoShelfStoreKey,
  seed: () => GeoShelfSource[],
  url: string
): GeoShelfSource | null {
  const sources = readGeoShelfStore(key, seed);
  return sources.find((candidate) => candidate.url === url) ?? null;
}

export function insertGeoShelfSource(
  key: GeoShelfStoreKey,
  seed: () => GeoShelfSource[],
  source: GeoShelfSource
): GeoShelfSource {
  const sources = readGeoShelfStore(key, seed);
  sources.unshift(source);
  return source;
}

export function patchGeoShelfSource(
  key: GeoShelfStoreKey,
  seed: () => GeoShelfSource[],
  sourceId: string,
  update: (current: GeoShelfSource) => GeoShelfSource
): GeoShelfSource | null {
  const sources = readGeoShelfStore(key, seed);
  const index = sources.findIndex((candidate) => candidate.id === sourceId);
  const current = sources[index];
  if (index < 0 || !current) {
    return null;
  }
  const next = update(current);
  sources[index] = next;
  return next;
}
