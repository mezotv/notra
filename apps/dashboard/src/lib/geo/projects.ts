import { db } from "@notra/db/drizzle";
import { brandSettings, projects } from "@notra/db/schema";
import type { GeoCheckScope } from "@notra/db/types/geo-checks";
import { and, asc, desc, eq } from "drizzle-orm";
import { Effect } from "effect";

import { geoDb } from "@/lib/geo/effect";
import {
  GeoBrandIdentityMissingError,
  GeoBrandIdentityNotFoundError,
  GeoProjectCreateFailedError,
  GeoProjectNotFoundError,
  GeoSettingsMissingError,
} from "@/lib/geo/errors";
import { toGeoProject } from "@/lib/geo/mappers";
import type {
  GeoProjectScope,
  GeoProjectsResponse,
  GeoScopeInput,
} from "@/types/geo";

export const listGeoProjects = Effect.fn("geo.projectsList")(function* (
  organizationId: string
) {
  const rows = yield* geoDb("projects lookup failed", () =>
    db.query.projects.findMany({
      where: eq(projects.organizationId, organizationId),
      orderBy: [asc(projects.createdAt)],
    })
  );

  const response: GeoProjectsResponse = {
    projects: rows.map(toGeoProject),
  };
  return response;
});

export const requireBrandIdentity = Effect.fn("geo.requireBrandIdentity")(
  function* (organizationId: string, brandSettingsId: string) {
    const identity = yield* geoDb("brand identity lookup failed", () =>
      db.query.brandSettings.findFirst({
        columns: { id: true },
        where: and(
          eq(brandSettings.id, brandSettingsId),
          eq(brandSettings.organizationId, organizationId)
        ),
      })
    );

    if (!identity) {
      return yield* Effect.fail(
        new GeoBrandIdentityNotFoundError({ brandSettingsId })
      );
    }

    return identity.id;
  }
);

const resolveDefaultBrandIdentity = Effect.fn(
  "geo.resolveDefaultBrandIdentity"
)(function* (organizationId: string) {
  const identity = yield* geoDb("brand identity lookup failed", () =>
    db.query.brandSettings.findFirst({
      columns: { id: true },
      where: eq(brandSettings.organizationId, organizationId),
      orderBy: [desc(brandSettings.isDefault), asc(brandSettings.createdAt)],
    })
  );

  if (!identity) {
    return yield* Effect.fail(
      new GeoBrandIdentityMissingError({ organizationId })
    );
  }

  return identity.id;
});

const findOldestProjectId = Effect.fn("geo.oldestProject")(function* (
  organizationId: string
) {
  const row = yield* geoDb("projects lookup failed", () =>
    db.query.projects.findFirst({
      columns: { id: true },
      where: eq(projects.organizationId, organizationId),
      orderBy: [asc(projects.createdAt)],
    })
  );

  return row?.id ?? null;
});

export const createGeoProject = Effect.fn("geo.projectCreate")(function* (
  organizationId: string,
  name: string,
  brandSettingsId?: string
) {
  const linkedBrandSettingsId = brandSettingsId
    ? yield* requireBrandIdentity(organizationId, brandSettingsId)
    : yield* resolveDefaultBrandIdentity(organizationId);

  const rows = yield* geoDb("project create failed", () =>
    db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        name: name.trim(),
        brandSettingsId: linkedBrandSettingsId,
      })
      .returning()
  );

  const row = rows.at(0);
  if (!row) {
    return yield* Effect.fail(new GeoProjectCreateFailedError({}));
  }

  return toGeoProject(row);
});

export const resolveGeoScope = Effect.fn("geo.resolveScope")(function* (
  input: GeoScopeInput
) {
  if (input.projectId) {
    const [oldestProject, row] = yield* Effect.all([
      findOldestProjectId(input.organizationId),
      geoDb("project lookup failed", () =>
        db.query.projects.findFirst({
          columns: { id: true, brandSettingsId: true },
          where: and(
            eq(projects.id, input.projectId ?? ""),
            eq(projects.organizationId, input.organizationId)
          ),
        })
      ),
    ]);

    if (!row) {
      return yield* Effect.fail(
        new GeoProjectNotFoundError({ projectId: input.projectId })
      );
    }

    const scope: GeoProjectScope = {
      organizationId: input.organizationId,
      projectId: row.id,
      brandSettingsId: row.brandSettingsId,
      includeUnassigned: row.id === oldestProject,
    };
    return scope;
  }

  const oldest = yield* geoDb("projects lookup failed", () =>
    db.query.projects.findFirst({
      columns: { id: true, brandSettingsId: true },
      where: eq(projects.organizationId, input.organizationId),
      orderBy: [asc(projects.createdAt)],
    })
  );

  const scope: GeoProjectScope = {
    organizationId: input.organizationId,
    projectId: oldest?.id ?? null,
    brandSettingsId: oldest?.brandSettingsId ?? null,
    includeUnassigned: true,
  };
  return scope;
});

export function geoCheckScope(scope: GeoProjectScope): GeoCheckScope {
  return {
    organizationId: scope.organizationId,
    projectId: scope.projectId ?? null,
  };
}

export function geoScopeParams(scope: GeoProjectScope): {
  organization_id: string;
  project_id: string;
  include_unassigned: number;
} {
  return {
    organization_id: scope.organizationId,
    project_id: scope.projectId ?? "",
    include_unassigned: scope.includeUnassigned ? 1 : 0,
  };
}

export const requireGeoProject = Effect.fn("geo.requireProject")(function* (
  input: GeoScopeInput
) {
  const scope = yield* resolveGeoScope(input);
  if (!scope.projectId || !scope.brandSettingsId) {
    return yield* Effect.fail(
      new GeoSettingsMissingError({ organizationId: scope.organizationId })
    );
  }
  return {
    ...scope,
    projectId: scope.projectId,
    brandSettingsId: scope.brandSettingsId,
  };
});

export const ensureGeoProject = Effect.fn("geo.ensureProject")(function* (
  input: GeoScopeInput,
  fallbackName: string
) {
  const scope = yield* resolveGeoScope(input);
  if (scope.projectId) {
    return scope.projectId;
  }

  const created = yield* createGeoProject(input.organizationId, fallbackName);
  return created.id;
});
