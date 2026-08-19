import { db } from "@notra/db/drizzle";
import { geoSettings } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { geoDb, geoSkip } from "@/lib/geo/effect";

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
    geoSkip("scan start stamp failed")
  );
  const finished = markGeoScanFinished(projectId).pipe(
    geoSkip("scan finish stamp failed")
  );
  const run = started.pipe(Effect.andThen(effect));
  if (options?.finishOn === "failure") {
    return run.pipe(Effect.onError(() => finished));
  }
  return run.pipe(Effect.ensuring(finished));
}
