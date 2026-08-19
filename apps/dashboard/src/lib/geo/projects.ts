import { db } from "@notra/db/drizzle";
import { projects } from "@notra/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { geoDb } from "@/lib/geo/effect";
import {
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
      orderBy: [desc(projects.isDefault), asc(projects.createdAt)],
    })
  );

  const response: GeoProjectsResponse = {
    projects: rows.map(toGeoProject),
  };
  return response;
});

export const createGeoProject = Effect.fn("geo.projectCreate")(function* (
  organizationId: string,
  name: string
) {
  const existing = yield* geoDb("projects lookup failed", () =>
    db.query.projects.findFirst({
      columns: { id: true },
      where: eq(projects.organizationId, organizationId),
    })
  );

  const rows = yield* geoDb("project create failed", () =>
    db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        name: name.trim(),
        isDefault: !existing,
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
    const row = yield* geoDb("project lookup failed", () =>
      db.query.projects.findFirst({
        columns: { id: true, isDefault: true },
        where: and(
          eq(projects.id, input.projectId ?? ""),
          eq(projects.organizationId, input.organizationId)
        ),
      })
    );

    if (!row) {
      return yield* Effect.fail(
        new GeoProjectNotFoundError({ projectId: input.projectId })
      );
    }

    const scope: GeoProjectScope = {
      organizationId: input.organizationId,
      projectId: row.id,
      includeUnassigned: row.isDefault,
    };
    return scope;
  }

  const row = yield* geoDb("default project lookup failed", () =>
    db.query.projects.findFirst({
      columns: { id: true, isDefault: true },
      where: eq(projects.organizationId, input.organizationId),
      orderBy: [desc(projects.isDefault), asc(projects.createdAt)],
    })
  );

  const scope: GeoProjectScope = {
    organizationId: input.organizationId,
    projectId: row?.id ?? null,
    includeUnassigned: row?.isDefault ?? true,
  };
  return scope;
});

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
  if (!scope.projectId) {
    return yield* Effect.fail(
      new GeoSettingsMissingError({ organizationId: scope.organizationId })
    );
  }
  return { ...scope, projectId: scope.projectId };
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
