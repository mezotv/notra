import { db } from "@notra/db/drizzle";
import { brandSettings, geoSettings, projects } from "@notra/db/schema";
import type { GeoCheckScope } from "@notra/db/types/geo-checks";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { Effect } from "effect";

import type {
  GeoProjectScope,
  GeoProjectsResponse,
  GeoProjectUpdateInput,
  GeoScopeInput,
} from "../types/geo";
import { geoDb, geoSkip } from "./effect";
import {
  GeoBrandIdentityMissingError,
  GeoBrandIdentityNotFoundError,
  GeoProjectCreateFailedError,
  GeoProjectDeleteBlockedError,
  GeoProjectNotFoundError,
  GeoScheduleCancelError,
  GeoSettingsMissingError,
} from "./errors";
import { lockGeoOrganization, lockGeoProject } from "./lock";
import { toGeoProject } from "./mappers";
import { runProjectDeleteAfterCancellation } from "./project-delete-compensation";
import { syncGeoScanSchedule } from "./schedule";
import { reconcileGeoScanSchedule } from "./schedule-reconcile";

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

export const updateGeoProject = Effect.fn("geo.projectUpdate")(function* (
  organizationId: string,
  projectId: string,
  update: GeoProjectUpdateInput
) {
  const linkedBrandSettingsId = update.brandSettingsId
    ? yield* requireBrandIdentity(organizationId, update.brandSettingsId)
    : undefined;

  const rows = yield* geoDb("project update failed", () =>
    db
      .update(projects)
      .set({
        ...(update.name === undefined ? {} : { name: update.name.trim() }),
        ...(linkedBrandSettingsId === undefined
          ? {}
          : { brandSettingsId: linkedBrandSettingsId }),
      })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organizationId, organizationId)
        )
      )
      .returning()
  );

  const row = rows.at(0);
  if (!row) {
    return yield* Effect.fail(new GeoProjectNotFoundError({ projectId }));
  }

  return toGeoProject(row);
});

interface GeoScanScheduleRow {
  qstashMessageId: string | null;
  enabled: boolean;
  scanIntervalHours: number;
}

const loadGeoScanSchedule = Effect.fn("geo.loadScanSchedule")(function* (
  organizationId: string,
  projectId: string
) {
  return yield* geoDb("settings lookup failed", () =>
    db.query.geoSettings.findFirst({
      columns: {
        qstashMessageId: true,
        enabled: true,
        scanIntervalHours: true,
      },
      where: and(
        eq(geoSettings.organizationId, organizationId),
        eq(geoSettings.projectId, projectId)
      ),
    })
  );
});

/**
 * Re-arms the scan schedule of a project whose delete was refused *after* its
 * pending QStash message was already cancelled.
 *
 * Without this, the loser of a concurrent last-two-projects delete keeps its
 * project but silently loses its scans: the message is gone, yet
 * `geo_settings.qstash_message_id` still names it, and
 * `syncGeoScanSchedule` hands a non-null `existingMessageId` straight back
 * unless it is asked to reschedule — so the next settings save "keeps" a
 * message that no longer exists and the project never scans again.
 *
 * Order matters: the dead id is cleared first, so even if publishing a
 * replacement fails the row is left in the honest "nothing scheduled" state
 * that the next settings save repairs. Every step is best-effort — the caller
 * is about to fail with the delete refusal, and that error must not be
 * replaced by a QStash hiccup.
 */
const restoreGeoScanSchedule = Effect.fn("geo.restoreScanSchedule")(function* (
  organizationId: string,
  projectId: string,
  settingsRow: GeoScanScheduleRow | undefined
) {
  if (!settingsRow?.qstashMessageId) {
    // Nothing was cancelled, so there is nothing to put back.
    return;
  }

  const cancelledMessageId = settingsRow.qstashMessageId;
  const clearedRows = yield* geoDb("scan schedule clear failed", () =>
    db
      .update(geoSettings)
      .set({ qstashMessageId: null })
      .where(
        and(
          eq(geoSettings.organizationId, organizationId),
          eq(geoSettings.projectId, projectId),
          eq(geoSettings.enabled, settingsRow.enabled),
          eq(geoSettings.scanIntervalHours, settingsRow.scanIntervalHours),
          eq(geoSettings.qstashMessageId, cancelledMessageId)
        )
      )
      .returning({ id: geoSettings.id })
  ).pipe(geoSkip("scan schedule clear failed"));

  // The project may have been deleted concurrently, or another request may
  // already have installed a new message. Neither case should be overwritten.
  if (!clearedRows?.length || !settingsRow.enabled) {
    return;
  }

  yield* reconcileGeoScanSchedule({
    organizationId,
    projectId,
    snapshot: {
      qstashMessageId: null,
      enabled: true,
      scanIntervalHours: settingsRow.scanIntervalHours,
    },
    reschedule: true,
  }).pipe(geoSkip("scan schedule restore failed"));
});

/**
 * Deletes a project and everything hanging off it.
 *
 * Safety notes:
 * - Every `geo_*` table declares `project_id ... ON DELETE CASCADE`, so the
 *   child rows go with the project in the same statement. `agent_feedback`
 *   declares `ON DELETE SET NULL`, so feedback survives unattached — that is
 *   deliberate, feedback is org-owned evidence, not project data.
 * - `brand_settings` is NOT deleted: `projects.brand_settings_id` points *at*
 *   it, several projects can share one identity, and it is reachable from the
 *   organization independently of any project.
 * - A pending QStash scan message is cancelled first, and a *failed*
 *   cancellation aborts the delete. Swallowing it would leave a delayed job
 *   that wakes up against a project that no longer exists.
 * - The organization's last project cannot be deleted: `resolveGeoScope` falls
 *   back to the oldest project, so removing the final one leaves every GEO
 *   read unresolvable. The count is re-taken inside the deleting transaction
 *   under an organization advisory lock, because two concurrent deletes each
 *   counting `2` would otherwise both proceed. `isSample` is deliberately NOT
 *   special-cased — a sample project is an ordinary project and is deletable
 *   as long as it is not the last one.
 */
export const deleteGeoProject = Effect.fn("geo.projectDelete")(function* (
  organizationId: string,
  projectId: string
) {
  const [existing, projectCount] = yield* Effect.all([
    geoDb("project lookup failed", () =>
      db.query.projects.findFirst({
        columns: { id: true },
        where: and(
          eq(projects.id, projectId),
          eq(projects.organizationId, organizationId)
        ),
      })
    ),
    geoDb("projects count failed", () =>
      db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.organizationId, organizationId))
    ),
  ]);

  if (!existing) {
    return yield* Effect.fail(new GeoProjectNotFoundError({ projectId }));
  }

  if ((projectCount.at(0)?.count ?? 0) <= 1) {
    return yield* Effect.fail(
      new GeoProjectDeleteBlockedError({ projectId, reason: "last_project" })
    );
  }

  let settingsRow = yield* loadGeoScanSchedule(organizationId, projectId);

  while (true) {
    const cancelledMessageId = settingsRow?.qstashMessageId ?? null;
    const pendingMessageId = yield* Effect.promise(() =>
      syncGeoScanSchedule({
        organizationId,
        projectId,
        enabled: false,
        scanIntervalHours: 0,
        existingMessageId: cancelledMessageId,
      })
    );
    if (pendingMessageId) {
      return yield* Effect.fail(new GeoScheduleCancelError({ projectId }));
    }

    // External QStash I/O stays outside the transaction. The locked database
    // phase verifies that the cancelled id is still current; if a settings
    // update installed another job, the loop cancels that newer id first.
    const outcome = yield* runProjectDeleteAfterCancellation(
      projectId,
      geoDb("project delete failed", () =>
        db.transaction(async (tx) => {
          await Effect.runPromise(lockGeoOrganization(tx, organizationId));
          await Effect.runPromise(lockGeoProject(tx, projectId));

          const target = await tx
            .select({ id: projects.id })
            .from(projects)
            .where(
              and(
                eq(projects.id, projectId),
                eq(projects.organizationId, organizationId)
              )
            )
            .limit(1)
            .for("update");
          if (!target.length) {
            return "not_found" as const;
          }

          const currentSchedule = await tx
            .select({ qstashMessageId: geoSettings.qstashMessageId })
            .from(geoSettings)
            .where(
              and(
                eq(geoSettings.organizationId, organizationId),
                eq(geoSettings.projectId, projectId)
              )
            )
            .limit(1)
            .for("update");
          if (
            (currentSchedule.at(0)?.qstashMessageId ?? null) !==
            cancelledMessageId
          ) {
            return "schedule_changed" as const;
          }

          const remaining = await tx
            .select({ count: count() })
            .from(projects)
            .where(eq(projects.organizationId, organizationId));
          if ((remaining.at(0)?.count ?? 0) <= 1) {
            return "last_project" as const;
          }

          const deleted = await tx
            .delete(projects)
            .where(
              and(
                eq(projects.id, projectId),
                eq(projects.organizationId, organizationId)
              )
            )
            .returning({ id: projects.id });
          return deleted.length ? ("deleted" as const) : ("not_found" as const);
        })
      ),
      restoreGeoScanSchedule(organizationId, projectId, settingsRow)
    );

    if (outcome !== "schedule_changed") {
      return { id: projectId, success: true as const };
    }
    settingsRow = yield* loadGeoScanSchedule(organizationId, projectId);
  }
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
