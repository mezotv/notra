import { db } from "@notra/db/drizzle";
import { geoSettings } from "@notra/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { Effect } from "effect";

import { geoDb } from "./effect";
import { syncGeoScanSchedule } from "./schedule";

interface GeoScanScheduleSnapshot {
  qstashMessageId: string | null;
  enabled: boolean;
  scanIntervalHours: number;
}

interface ReconcileGeoScanScheduleInput {
  organizationId: string;
  projectId: string;
  snapshot: GeoScanScheduleSnapshot;
  reschedule: boolean;
}

const MAX_SCHEDULE_RECONCILE_ATTEMPTS = 5;

const cancelGeoScanMessage = Effect.fn("geo.cancelScanMessage")(function* (
  organizationId: string,
  projectId: string,
  messageId: string
) {
  const pendingMessageId = yield* Effect.promise(() =>
    syncGeoScanSchedule({
      organizationId,
      projectId,
      enabled: false,
      scanIntervalHours: 0,
      existingMessageId: messageId,
    })
  );
  if (pendingMessageId) {
    yield* Effect.logWarning(
      `Could not cancel superseded GEO scan schedule ${pendingMessageId}`
    );
  }
});

/**
 * Replaces a project's QStash message with a compare-and-set. A concurrent
 * delete or settings write can win the database race, but it cannot leave the
 * losing request's newly published message behind.
 */
export const reconcileGeoScanSchedule = Effect.fn("geo.reconcileScanSchedule")(
  function* (input: ReconcileGeoScanScheduleInput) {
    let snapshot = input.snapshot;
    let reschedule = input.reschedule;

    for (
      let attempt = 0;
      attempt < MAX_SCHEDULE_RECONCILE_ATTEMPTS;
      attempt++
    ) {
      const attemptSnapshot = snapshot;
      const shouldReschedule = reschedule;
      const nextMessageId = yield* Effect.promise(() =>
        syncGeoScanSchedule({
          organizationId: input.organizationId,
          projectId: input.projectId,
          enabled: attemptSnapshot.enabled,
          scanIntervalHours: attemptSnapshot.scanIntervalHours,
          existingMessageId: attemptSnapshot.qstashMessageId,
          reschedule: shouldReschedule,
        })
      );

      if (nextMessageId === attemptSnapshot.qstashMessageId) {
        return;
      }

      const cancelReplacement = nextMessageId
        ? cancelGeoScanMessage(
            input.organizationId,
            input.projectId,
            nextMessageId
          )
        : Effect.succeed(undefined);
      const snapshotMatches = attemptSnapshot.qstashMessageId
        ? eq(geoSettings.qstashMessageId, attemptSnapshot.qstashMessageId)
        : isNull(geoSettings.qstashMessageId);
      const updatedRows = yield* geoDb("scan schedule update failed", () =>
        db
          .update(geoSettings)
          .set({ qstashMessageId: nextMessageId })
          .where(
            and(
              eq(geoSettings.organizationId, input.organizationId),
              eq(geoSettings.projectId, input.projectId),
              eq(geoSettings.enabled, attemptSnapshot.enabled),
              eq(
                geoSettings.scanIntervalHours,
                attemptSnapshot.scanIntervalHours
              ),
              snapshotMatches
            )
          )
          .returning({ id: geoSettings.id })
      ).pipe(
        Effect.catch((error) =>
          cancelReplacement.pipe(
            Effect.exit,
            Effect.andThen(Effect.fail(error))
          )
        )
      );

      if (updatedRows.length) {
        if (attemptSnapshot.qstashMessageId && nextMessageId) {
          yield* cancelGeoScanMessage(
            input.organizationId,
            input.projectId,
            attemptSnapshot.qstashMessageId
          );
        }
        return;
      }

      yield* cancelReplacement;

      const current = yield* geoDb("settings lookup failed", () =>
        db.query.geoSettings.findFirst({
          columns: {
            qstashMessageId: true,
            enabled: true,
            scanIntervalHours: true,
          },
          where: and(
            eq(geoSettings.organizationId, input.organizationId),
            eq(geoSettings.projectId, input.projectId)
          ),
        })
      );
      if (!current) {
        return;
      }

      snapshot = current;
      reschedule = current.enabled;
    }

    yield* Effect.logWarning(
      `GEO scan schedule kept changing for project ${input.projectId}; reconciliation stopped after ${MAX_SCHEDULE_RECONCILE_ATTEMPTS} attempts`
    );
  }
);
