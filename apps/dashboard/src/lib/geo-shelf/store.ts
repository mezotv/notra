import type { GeoShelfSource, GeoShelfStoreKey } from "@/types/geo-shelf";

const stores = new Map<string, GeoShelfSource[]>();

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
  return seeded;
}

export function insertGeoShelfSource(
  key: GeoShelfStoreKey,
  seed: () => GeoShelfSource[],
  source: GeoShelfSource
): GeoShelfSource {
  const sources = readGeoShelfStore(key, seed);
  const existingIndex = sources.findIndex(
    (candidate) => candidate.id === source.id || candidate.url === source.url
  );
  if (existingIndex >= 0) {
    sources[existingIndex] = source;
    return source;
  }
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
