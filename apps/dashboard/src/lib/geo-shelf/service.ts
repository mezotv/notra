import { db } from "@notra/db/drizzle";
import { brandSettings, projects } from "@notra/db/schema";
import {
  loadGeoCompetitors,
  loadGeoSettings,
} from "@notra/geo-core/geo/programs";
import type { GeoScopeInput } from "@notra/geo-core/types/geo";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { GEO_SHELF_OPEN_STATUSES } from "@/constants/geo-shelf";
import { buildGeoShelfFixture } from "@/lib/geo-shelf/fixtures";
import {
  insertGeoShelfSource,
  patchGeoShelfSource,
  readGeoShelfStore,
} from "@/lib/geo-shelf/store";
import { canonicalizeShelfUrl, shelfDomainFromUrl } from "@/lib/geo-shelf/url";
import type {
  GeoShelfCreateInput,
  GeoShelfOpportunity,
  GeoShelfOpportunityWrite,
  GeoShelfPlacement,
  GeoShelfPlacementWrite,
  GeoShelfSource,
  GeoShelfStoreSeed,
  GeoShelfUpdateInput,
} from "@/types/geo-shelf";
import { getWebsiteDomain } from "@/utils/brand";

async function findProjectDomain(projectId: string): Promise<string | null> {
  const [row] = await db
    .select({ websiteUrl: brandSettings.websiteUrl })
    .from(projects)
    .innerJoin(brandSettings, eq(projects.brandSettingsId, brandSettings.id))
    .where(eq(projects.id, projectId))
    .limit(1);
  return getWebsiteDomain(row?.websiteUrl ?? null);
}

export const loadGeoShelfContext = Effect.fn("geo.shelf.context")(function* (
  input: GeoScopeInput
) {
  const [settingsResponse, competitorsResponse] = yield* Effect.all([
    loadGeoSettings(input),
    loadGeoCompetitors(input),
  ]);
  const settings = settingsResponse.settings;
  const ownDomain = settings
    ? yield* Effect.promise(() => findProjectDomain(settings.projectId))
    : null;
  return {
    settings,
    competitors: competitorsResponse.competitors,
    ownDomain,
  };
});

function storeKey(seed: GeoShelfStoreSeed) {
  return {
    organizationId: seed.settings.organizationId,
    projectId: seed.settings.projectId,
  };
}

function seedFixture(seed: GeoShelfStoreSeed) {
  return () =>
    buildGeoShelfFixture({
      ownBrandName: seed.settings.companyName,
      ownDomain: seed.ownDomain,
      competitors: seed.competitors,
      engines: seed.settings.engines,
      members: seed.members,
      now: new Date(),
    });
}

export function listGeoShelfSources(seed: GeoShelfStoreSeed): GeoShelfSource[] {
  return readGeoShelfStore(storeKey(seed), seedFixture(seed));
}

function isClosedStatus(status: GeoShelfOpportunityWrite["status"]): boolean {
  return !GEO_SHELF_OPEN_STATUSES.includes(status);
}

function buildOpportunity(
  write: GeoShelfOpportunityWrite,
  userId: string,
  nowIso: string,
  existing: GeoShelfOpportunity | null
): GeoShelfOpportunity {
  const resolvedAt = isClosedStatus(write.status)
    ? (existing?.resolvedAt ?? nowIso)
    : null;
  return {
    id: existing?.id ?? crypto.randomUUID(),
    ...write,
    createdByUserId: existing?.createdByUserId ?? userId,
    resolvedAt,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
}

function buildPlacements(
  seed: GeoShelfStoreSeed,
  writes: GeoShelfPlacementWrite[],
  nowIso: string,
  existing: GeoShelfPlacement[] = []
): GeoShelfPlacement[] {
  const writeByBrand = new Map(
    writes.map((write) => [write.competitorId ?? "", write.status])
  );
  const existingByBrand = new Map(
    existing.map((placement) => [placement.competitorId ?? "", placement])
  );
  const brands: {
    competitorId: string | null;
    name: string;
    domain: string | null;
  }[] = [
    {
      competitorId: null,
      name: seed.settings.companyName,
      domain: seed.ownDomain,
    },
    ...seed.competitors.map((competitor) => ({
      competitorId: competitor.id,
      name: competitor.name,
      domain: competitor.domain,
    })),
  ];

  return brands.map((brand) => {
    const key = brand.competitorId ?? "";
    const previous = existingByBrand.get(key);
    const written = writeByBrand.get(key);
    if (written === undefined && previous) {
      return previous;
    }
    const status = written ?? "unknown";
    return {
      competitorId: brand.competitorId,
      brandName: brand.name,
      brandDomain: brand.domain,
      status,
      position: status === "present" ? (previous?.position ?? null) : null,
      hasLink: status === "present" ? (previous?.hasLink ?? false) : false,
      evidence: "manual",
      excerpt: previous?.excerpt ?? null,
      checkedAt: nowIso,
    };
  });
}

export function createGeoShelfSource(
  seed: GeoShelfStoreSeed,
  input: GeoShelfCreateInput,
  userId: string
): GeoShelfSource {
  const nowIso = new Date().toISOString();
  const url = canonicalizeShelfUrl(input.url);
  const source: GeoShelfSource = {
    id: input.id ?? crypto.randomUUID(),
    url,
    domain: shelfDomainFromUrl(url),
    title: input.title,
    kind: input.kind,
    ownership: "third_party",
    origin: "manual",
    fetchStatus: "pending",
    lastFetchedAt: null,
    citations: {
      windowCount: 0,
      totalCount: 0,
      promptCount: 0,
      engines: [],
      firstCitedAt: null,
      lastCitedAt: null,
    },
    placements: buildPlacements(seed, input.placements, nowIso),
    opportunity: input.opportunity
      ? buildOpportunity(input.opportunity, userId, nowIso, null)
      : null,
    createdByUserId: userId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  return insertGeoShelfSource(storeKey(seed), seedFixture(seed), source);
}

export function updateGeoShelfSource(
  seed: GeoShelfStoreSeed,
  input: GeoShelfUpdateInput,
  userId: string
): GeoShelfSource | null {
  const nowIso = new Date().toISOString();
  const resolveOpportunity = (
    current: GeoShelfOpportunity | null
  ): GeoShelfOpportunity | null => {
    if (input.opportunity === undefined) {
      return current;
    }
    if (input.opportunity === null) {
      return null;
    }
    return buildOpportunity(input.opportunity, userId, nowIso, current);
  };
  return patchGeoShelfSource(
    storeKey(seed),
    seedFixture(seed),
    input.sourceId,
    (current) => ({
      ...current,
      title: input.title === undefined ? current.title : input.title,
      kind: input.kind ?? current.kind,
      placements: input.placements
        ? buildPlacements(seed, input.placements, nowIso, current.placements)
        : current.placements,
      opportunity: resolveOpportunity(current.opportunity),
      updatedAt: nowIso,
    })
  );
}

export function hasGeoShelfScanData(sources: GeoShelfSource[]): boolean {
  return sources.some((source) => source.origin === "scan");
}
