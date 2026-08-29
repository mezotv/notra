import { db } from "@notra/db/drizzle";
import { geoScans, geoSettings } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { Effect, Exit } from "effect";

import { geoDb, geoSkip } from "@/lib/geo/effect";
import type { GeoDatabaseError } from "@/lib/geo/errors";
import { describeGeoCause, geoLogError } from "@/lib/geo/log";

const markGeoScanStarted = Effect.fn("geo.markScanStarted")(function* (
  projectId: string
) {
  yield* geoDb("scan start stamp failed", () =>
    db
      .update(geoSettings)
      .set({ scanStartedAt: new Date() })
      .where(eq(geoSettings.projectId, projectId))
  );
});

export const markGeoScanFinished = Effect.fn("geo.markScanFinished")(function* (
  projectId: string
) {
  yield* geoDb("scan finish stamp failed", () =>
    db
      .update(geoSettings)
      .set({ lastScanAt: new Date() })
      .where(eq(geoSettings.projectId, projectId))
  );
});

interface GeoScanStatusOptions {
  /**
   * `always` (default): stamp finished whenever the effect completes
   * (success, failure or interruption).
   * `failure`: only stamp finished when the effect fails — for callers that
   * merely *start* a scan and leave the success stamp to the scan itself.
   */
  finishOn?: "always" | "failure";
}

/**
 * Marks the scan as started, runs `effect`, then marks it finished.
 * Stamp failures are logged and swallowed and never affect the wrapped
 * effect's result or error.
 */
export function withGeoScanStatus<A, E, R>(
  projectId: string,
  effect: Effect.Effect<A, E, R>,
  options?: GeoScanStatusOptions
): Effect.Effect<A, E, R> {
  const started = markGeoScanStarted(projectId).pipe(
    geoSkip("scan start stamp failed", {
      event: "geo.scan.stamp_failed",
      projectId,
      stamp: "started",
    })
  );
  const finished = markGeoScanFinished(projectId).pipe(
    geoSkip("scan finish stamp failed", {
      event: "geo.scan.stamp_failed",
      projectId,
      stamp: "finished",
    })
  );
  const run = started.pipe(Effect.andThen(effect));
  if (options?.finishOn === "failure") {
    return run.pipe(Effect.onError(() => finished));
  }
  return run.pipe(Effect.ensuring(finished));
}

interface GeoScanRunScope {
  organizationId: string;
  projectId: string;
}

const createGeoScanRow = Effect.fn("geo.createScanRow")(function* (
  scope: GeoScanRunScope
) {
  const scanId = crypto.randomUUID();
  yield* geoDb("scan row insert failed", () =>
    db.insert(geoScans).values({
      id: scanId,
      organizationId: scope.organizationId,
      projectId: scope.projectId,
      status: "running",
      startedAt: new Date(),
    })
  );
  return scanId;
});

const finishGeoScanRow = Effect.fn("geo.finishScanRow")(function* (
  scanId: string,
  status: "completed" | "failed"
) {
  yield* geoDb("scan row finish failed", () =>
    db
      .update(geoScans)
      .set({ status, finishedAt: new Date() })
      .where(eq(geoScans.id, scanId))
  );
});

/**
 * Runs one persisted scan: inserts a `geo_scans` row, hands its id to
 * `run`, and stamps the row `completed` on success or `failed` on error or
 * interruption. Also maintains the `geo_settings` started/finished stamps the
 * dashboard polls. Insert failure aborts the scan — checks FK to `geo_scans`,
 * so a synthetic id would only waste model calls.
 */
export function withGeoScanRun<A, E, R>(
  scope: GeoScanRunScope,
  run: (scanId: string) => Effect.Effect<A, E, R>
): Effect.Effect<A, E | GeoDatabaseError, R> {
  const tracked = Effect.gen(function* () {
    const scanId = yield* createGeoScanRow(scope);
    return yield* run(scanId).pipe(
      Effect.onExit((exit) =>
        Effect.gen(function* () {
          if (Exit.isFailure(exit)) {
            yield* geoLogError({
              event: "geo.scan.failed",
              organizationId: scope.organizationId,
              projectId: scope.projectId,
              scanId,
              ...describeGeoCause(exit.cause),
            });
          }
          const status = Exit.isSuccess(exit) ? "completed" : "failed";
          yield* finishGeoScanRow(scanId, status).pipe(
            geoSkip("scan row finish failed", {
              event: "geo.scan.stamp_failed",
              projectId: scope.projectId,
              scanId,
              stamp: status,
            })
          );
        })
      )
    );
  });
  return withGeoScanStatus(scope.projectId, tracked);
}
