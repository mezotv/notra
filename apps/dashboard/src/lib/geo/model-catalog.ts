import { GEO_CURSOR_ENGINE_ID } from "@/constants/geo";
import {
  GEO_MODEL_FEED_REVALIDATE_SECONDS,
  GEO_MODEL_FEED_URL,
} from "@/constants/geo-model-catalog";
import { isCursorEngineEnabledForOrganization } from "@/lib/geo/cursor-flag";
import { geoModelFeedSchema } from "@/schemas/geo-model-feed";
import type { GeoModelCatalog } from "@/types/geo";
import {
  buildGeoModelCatalogFromFeed,
  seedGeoModelCatalog,
  withoutGeoModelCatalogEntries,
} from "@/utils/geo-model-catalog";

const MS_PER_SECOND = 1000;

let cached: { catalog: GeoModelCatalog; expiresAt: number } | null = null;

async function fetchGeoModelCatalog(): Promise<GeoModelCatalog> {
  const response = await fetch(GEO_MODEL_FEED_URL, {
    next: { revalidate: GEO_MODEL_FEED_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`Model feed responded with ${response.status}`);
  }
  const feed = geoModelFeedSchema.parse(await response.json());
  const catalog = buildGeoModelCatalogFromFeed(feed.data);
  if (catalog.models.length === 0) {
    throw new Error("Model feed returned no eligible models");
  }
  return catalog;
}

async function loadSharedGeoModelCatalog(): Promise<GeoModelCatalog> {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.catalog;
  }
  try {
    const catalog = await fetchGeoModelCatalog();
    cached = {
      catalog,
      expiresAt: Date.now() + GEO_MODEL_FEED_REVALIDATE_SECONDS * MS_PER_SECOND,
    };
    return catalog;
  } catch (error) {
    console.error("[geo] model feed unavailable, using seed catalog", error);
    return cached?.catalog ?? seedGeoModelCatalog();
  }
}

/**
 * The shared catalog narrowed to what one organization may see. Cursor is
 * flag-gated per organization on top of its credential check.
 */
export async function loadGeoModelCatalog(
  organizationId: string
): Promise<GeoModelCatalog> {
  const [catalog, cursorEnabled] = await Promise.all([
    loadSharedGeoModelCatalog(),
    isCursorEngineEnabledForOrganization(organizationId),
  ]);
  if (cursorEnabled) {
    return catalog;
  }
  return withoutGeoModelCatalogEntries(catalog, [GEO_CURSOR_ENGINE_ID]);
}
