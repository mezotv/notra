import { deleteStaleGeoOpenCodeBoxes } from "@notra/ai/utils/geo-opencode-box";
import { db } from "@notra/db/drizzle";
import { geoSettings } from "@notra/db/schema";
import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { Effect } from "effect";

import { GEO_SCAN_DUE_LIMIT_PER_SWEEP } from "../constants/geo";
import type { GeoScanCronSweepResult } from "../types/geo";
import { geoLogWarn, logGeoSkip } from "../utils/geo-log";
import { geoDb, geoSkip } from "./effect";
import { startClaimedGeoScanRun } from "./scan-handoff";
import { claimGeoScanRun, sweepStaleGeoScanRows } from "./scan-status";

export function nextGeoScanAt(scanIntervalHours: number, from = new Date()) {
  return new Date(from.getTime() + scanIntervalHours * 60 * 60 * 1000);
}

/**
 * Advances `next_scan_at` for one due settings row with a compare-and-set on
 * the due condition, so overlapping cron ticks cannot both fire the same
 * project. The stamp moves *before* the scan starts — matching the old
 * schedule, which queued the next trigger before running — so a failed scan
 * waits a full interval instead of hot-looping every sweep.
 *
 * `next_scan_at IS NULL` counts as due: rows migrated from the message-based
 * schedule (and rows enabled before this column existed) catch up on the
 * first sweep after deploy.
 */
const claimDueGeoScanTick = Effect.fn("geo.claimDueScanTick")(function* (row: {
  id: string;
  scanIntervalHours: number;
}) {
  const now = new Date();
  const claimed = yield* geoDb("scan tick claim failed", () =>
    db
      .update(geoSettings)
      .set({ nextScanAt: nextGeoScanAt(row.scanIntervalHours, now) })
      .where(
        and(
          eq(geoSettings.id, row.id),
          eq(geoSettings.enabled, true),
          or(isNull(geoSettings.nextScanAt), lte(geoSettings.nextScanAt, now))
        )
      )
      .returning({ id: geoSettings.id })
  );
  return claimed.length > 0;
});

/**
 * One cron sweep: fails scan rows a killed run left on "running", then starts
 * a workflow for every project whose `next_scan_at` has passed. Losing the
 * per-project scan-slot claim (a manual scan is in flight) skips the project;
 * its tick was already advanced, exactly like the message-based schedule
 * queued the next trigger regardless of the current scan's fate.
 */
export const runGeoScanCronSweep = Effect.fn("geo.runScanCronSweep")(
  function* () {
    yield* Effect.tryPromise({
      try: deleteStaleGeoOpenCodeBoxes,
      catch: (cause) => cause,
    }).pipe(geoSkip("stale OpenCode box sweep failed"));

    const staleScansFailed = yield* sweepStaleGeoScanRows().pipe(
      geoSkip("stale scan sweep failed"),
      Effect.map((count) => count ?? 0)
    );

    const now = new Date();
    const dueRows = yield* geoDb("due scan lookup failed", () =>
      db.query.geoSettings.findMany({
        columns: {
          id: true,
          organizationId: true,
          projectId: true,
          scanIntervalHours: true,
        },
        where: and(
          eq(geoSettings.enabled, true),
          or(isNull(geoSettings.nextScanAt), lte(geoSettings.nextScanAt, now))
        ),
        orderBy: [asc(sql`${geoSettings.nextScanAt} nulls first`)],
        limit: GEO_SCAN_DUE_LIMIT_PER_SWEEP,
      })
    );

    let started = 0;
    let skipped = 0;
    for (const row of dueRows) {
      const ticked = yield* claimDueGeoScanTick(row).pipe(
        geoSkip("scan tick claim failed")
      );
      if (!ticked) {
        skipped += 1;
        continue;
      }

      const claim = yield* claimGeoScanRun(row.projectId).pipe(
        geoSkip("scan claim failed")
      );
      if (!claim) {
        skipped += 1;
        yield* geoLogWarn({
          event: "geo.scan.skipped",
          reason: "already_running",
          organizationId: row.organizationId,
          projectId: row.projectId,
        });
        continue;
      }

      const startResult = yield* startClaimedGeoScanRun(
        row.organizationId,
        row.projectId,
        claim.claimedAt
      ).pipe(
        Effect.catch((error) =>
          Effect.sync(() => {
            logGeoSkip("scheduled scan start failed", undefined, error);
            return null;
          })
        )
      );
      if (startResult) {
        started += 1;
      } else {
        skipped += 1;
      }
    }

    const result: GeoScanCronSweepResult = {
      due: dueRows.length,
      started,
      skipped,
      staleScansFailed,
    };
    return result;
  }
);
