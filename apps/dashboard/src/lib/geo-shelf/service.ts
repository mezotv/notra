import { db } from "@notra/db/drizzle";
import { brandSettings, projects } from "@notra/db/schema";
import { GEO_SAMPLE_DATA_ENABLED } from "@notra/geo-core/constants/geo";
import {
  loadGeoCompetitors,
  loadGeoSettings,
} from "@notra/geo-core/geo/programs";
import type { GeoScopeInput } from "@notra/geo-core/types/geo";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import {
  GEO_SHELF_DUPLICATE_URL_MESSAGE,
  GEO_SHELF_OPEN_STATUSES,
} from "@/constants/geo-shelf";
import { buildGeoShelfFixture } from "@/lib/geo-shelf/fixtures";
import { assertGeoShelfOpportunityMembers } from "@/lib/geo-shelf/members";
import {
  findGeoShelfSourceByUrl,
  insertGeoShelfSource,
  isGeoShelfStoreSampleSeeded,
  patchGeoShelfSource,
  readGeoShelfStore,
} from "@/lib/geo-shelf/store";
import { canonicalizeShelfUrl, shelfDomainFromUrl } from "@/lib/geo-shelf/url";
import { conflict } from "@/lib/orpc/utils/errors";
import { geoShelfSourceSchema } from "@/schemas/geo-shelf";
import type {
  GeoShelfCreateInput,
  GeoShelfOpportunity,
  GeoShelfOpportunityWrite,
  GeoShelfPlacement,
  GeoShelfPlacementWrite,
  GeoShelfSource,
  GeoShelfSourceList,
  GeoShelfStoreKey,
  GeoShelfStoreSeed,
  GeoShelfUpdateInput,
  GeoShelfUpdateResult,
} from "@/types/geo-shelf";
import { getWebsiteDomain } from "@/utils/brand";

interface GeoShelfBrand {
  competitorId: string | null;
  name: string;
  domain: string | null;
}

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

function storeKey(seed: GeoShelfStoreSeed): GeoShelfStoreKey {
  return {
    organizationId: seed.settings.organizationId,
    projectId: seed.settings.projectId,
  };
}

/** Fixture rows are demo content: never seed them outside sample data mode. */
function seedFixture(seed: GeoShelfStoreSeed) {
  return () => {
    if (!GEO_SAMPLE_DATA_ENABLED) {
      return [];
    }
    return buildGeoShelfFixture({
      ownBrandName: seed.settings.companyName,
      ownDomain: seed.ownDomain,
      competitors: seed.competitors,
      engines: seed.settings.engines,
      members: seed.members,
      now: new Date(),
    });
  };
}

export function listGeoShelfSources(
  seed: GeoShelfStoreSeed
): GeoShelfSourceList {
  const key = storeKey(seed);
  const sources = readGeoShelfStore(key, seedFixture(seed));
  return { sources, isSampleData: isGeoShelfStoreSampleSeeded(key) };
}

function isClosedStatus(status: GeoShelfOpportunityWrite["status"]): boolean {
  return !GEO_SHELF_OPEN_STATUSES.includes(status);
}

function normalizeTitle(title: string | null | undefined): string | null {
  const trimmed = title?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
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
  // The point of contact defaults to the assignee, so storing the same person
  // twice would only create a second id to keep in sync.
  const pocMemberId =
    write.pocMemberId === write.assigneeMemberId ? null : write.pocMemberId;
  return {
    id: existing?.id ?? crypto.randomUUID(),
    ...write,
    pocMemberId,
    createdByUserId: existing?.createdByUserId ?? userId,
    resolvedAt,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
}

function shelfBrands(seed: GeoShelfStoreSeed): GeoShelfBrand[] {
  return [
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
}

function placementKey(competitorId: string | null): string {
  return competitorId ?? "";
}

function toPlacement(
  brand: GeoShelfBrand,
  status: GeoShelfPlacement["status"],
  nowIso: string,
  previous: GeoShelfPlacement | undefined
): GeoShelfPlacement {
  const isPresent = status === "present";
  return {
    competitorId: brand.competitorId,
    brandName: brand.name,
    brandDomain: brand.domain,
    status,
    position: isPresent ? (previous?.position ?? null) : null,
    hasLink: isPresent ? (previous?.hasLink ?? false) : false,
    evidence: "manual",
    excerpt: previous?.excerpt ?? null,
    checkedAt: nowIso,
  };
}

function buildPlacements(
  seed: GeoShelfStoreSeed,
  writes: GeoShelfPlacementWrite[],
  nowIso: string
): GeoShelfPlacement[] {
  const statusByBrand = new Map(
    writes.map((write) => [placementKey(write.competitorId), write.status])
  );
  return shelfBrands(seed).map((brand) =>
    toPlacement(
      brand,
      statusByBrand.get(placementKey(brand.competitorId)) ?? "unknown",
      nowIso,
      undefined
    )
  );
}

/**
 * Only the brands named in `writes` whose status really changed are rewritten.
 * Everything else keeps its fetch evidence, position and check timestamp.
 */
function mergePlacements(
  seed: GeoShelfStoreSeed,
  existing: GeoShelfPlacement[],
  writes: GeoShelfPlacementWrite[],
  nowIso: string
): GeoShelfPlacement[] {
  if (writes.length === 0) {
    return existing;
  }
  const brandByKey = new Map(
    shelfBrands(seed).map((brand) => [placementKey(brand.competitorId), brand])
  );
  const next = [...existing];
  let changed = false;
  for (const write of writes) {
    const key = placementKey(write.competitorId);
    const index = next.findIndex(
      (placement) => placementKey(placement.competitorId) === key
    );
    const previous = next[index];
    if (previous?.status === write.status) {
      continue;
    }
    const brand =
      brandByKey.get(key) ??
      (previous && {
        competitorId: previous.competitorId,
        name: previous.brandName,
        domain: previous.brandDomain,
      });
    if (!brand) {
      continue;
    }
    const placement = toPlacement(brand, write.status, nowIso, previous);
    changed = true;
    if (index < 0) {
      next.push(placement);
      continue;
    }
    next[index] = placement;
  }
  return changed ? next : existing;
}

export function createGeoShelfSource(
  seed: GeoShelfStoreSeed,
  input: GeoShelfCreateInput,
  userId: string
): GeoShelfSource {
  assertGeoShelfOpportunityMembers(seed.members, input.opportunity, null);
  const nowIso = new Date().toISOString();
  const url = canonicalizeShelfUrl(input.url);
  const key = storeKey(seed);
  const seedSources = seedFixture(seed);
  if (findGeoShelfSourceByUrl(key, seedSources, url)) {
    throw conflict(GEO_SHELF_DUPLICATE_URL_MESSAGE);
  }
  // Validate before touching the store: a rejected record must not end up in
  // the shelf list of the organization.
  const source = geoShelfSourceSchema.parse({
    id: crypto.randomUUID(),
    url,
    domain: shelfDomainFromUrl(url),
    title: normalizeTitle(input.title),
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
  } satisfies GeoShelfSource);
  return insertGeoShelfSource(key, seedSources, source);
}

export function updateGeoShelfSource(
  seed: GeoShelfStoreSeed,
  input: GeoShelfUpdateInput,
  userId: string
): GeoShelfUpdateResult | null {
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
    assertGeoShelfOpportunityMembers(seed.members, input.opportunity, current);
    return buildOpportunity(input.opportunity, userId, nowIso, current);
  };
  let assigneeChanged = false;
  let placementsChanged = false;
  const source = patchGeoShelfSource(
    storeKey(seed),
    seedFixture(seed),
    input.sourceId,
    (current) => {
      const opportunity = resolveOpportunity(current.opportunity);
      const placements = input.placements
        ? mergePlacements(seed, current.placements, input.placements, nowIso)
        : current.placements;
      assigneeChanged =
        (opportunity?.assigneeMemberId ?? null) !==
        (current.opportunity?.assigneeMemberId ?? null);
      placementsChanged = placements !== current.placements;
      return geoShelfSourceSchema.parse({
        ...current,
        title:
          input.title === undefined
            ? current.title
            : normalizeTitle(input.title),
        kind: input.kind ?? current.kind,
        placements,
        opportunity,
        updatedAt: nowIso,
      } satisfies GeoShelfSource);
    }
  );
  if (!source) {
    return null;
  }
  return { source, assigneeChanged, placementsChanged };
}

export function hasGeoShelfScanData(sources: GeoShelfSource[]): boolean {
  return sources.some((source) => source.origin === "scan");
}
