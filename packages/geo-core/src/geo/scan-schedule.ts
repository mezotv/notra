import { deleteStaleGeoOpenCodeBoxes } from "@notra/ai/utils/geo-opencode-box";
import { db } from "@notra/db/drizzle";
import { geoSettings } from "@notra/db/schema";
import { and, asc, desc, eq, isNull, lte, or } from "drizzle-orm";
import { Effect } from "effect";

import {
  GEO_SCAN_DUE_LIMIT_PER_SWEEP,
  GEO_SCAN_STALE_MS,
} from "../constants/geo";
import type { GeoScanCronSweepResult } from "../types/geo";
import { geoLogInfo, geoLogWarn, logGeoSkip } from "../utils/geo-log";
import { geoDb, geoSkip } from "./effect";
import { startClaimedGeoScanRun } from "./scan-handoff";
import { claimGeoScanRun, sweepStaleGeoScanRows } from "./scan-status";

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

function geoScanIntervalMs(scanIntervalHours: number) {
  return scanIntervalHours * MS_PER_HOUR;
}

/**
 * Arms a schedule that has no usable anchor: one interval out from `from`,
 * truncated to the whole minute. The cron sweep fires a few dozen seconds
 * into each ten-minute slot, so a stamp carrying the seconds of an earlier
 * sweep sits a hair *after* the tick that should catch it and slips a slot.
 * Whole-minute stamps are always strictly before that tick.
 */
export function nextGeoScanAt(scanIntervalHours: number, from = new Date()) {
  const armed = from.getTime() + geoScanIntervalMs(scanIntervalHours);
  return new Date(armed - (armed % MS_PER_MINUTE));
}

/**
 * The stamp that follows `dueAt` on a fixed cadence: the first
 * `dueAt + n × interval` that lies at least `GEO_SCAN_STALE_MS` past `now`.
 *
 * Anchoring on the previous stamp instead of on `now` is what keeps a daily
 * scan at the same time of day. The sweep polls every ten minutes, so `now`
 * is always a few seconds to minutes late; `now + interval` compounded that
 * lateness into a stamp that crept ~10 minutes later every single day.
 *
 * The lead of one stale window matters when a schedule catches up after a
 * long outage: a slot that would fall a minute after the catch-up scan starts
 * is skipped, because the claim of the scan just started would reject it as
 * `already_running` anyway and burn a full interval.
 */
export function nextGeoScanAtAfter(
  scanIntervalHours: number,
  dueAt: Date,
  now = new Date()
) {
  const interval = geoScanIntervalMs(scanIntervalHours);
  const earliest = now.getTime() + GEO_SCAN_STALE_MS;
  const elapsed = Math.max(0, earliest - dueAt.getTime());
  const steps = Math.floor(elapsed / interval) + 1;
  return new Date(dueAt.getTime() + steps * interval);
}

/**
 * The stamp a schedule gets when it is (re)armed from settings: the next slot
 * on the cadence after the last finished scan, or due immediately when that
 * slot has already passed (no scan yet, or the last one is older than the
 * interval). Enabling scans or shortening the interval therefore never pushes
 * the first scan a full interval away.
 */
export function rearmedGeoScanAt(
  scanIntervalHours: number,
  lastScanAt: Date | null,
  now = new Date()
) {
  if (!lastScanAt) {
    return now;
  }
  const next = new Date(
    lastScanAt.getTime() + geoScanIntervalMs(scanIntervalHours)
  );
  return next > now ? next : now;
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
 * first sweep after deploy and are armed one interval out; every later tick
 * stays on that cadence.
 */
const claimDueGeoScanTick = Effect.fn("geo.claimDueScanTick")(function* (row: {
  id: string;
  scanIntervalHours: number;
  nextScanAt: Date | null;
}) {
  const now = new Date();
  const nextScanAt = row.nextScanAt
    ? nextGeoScanAtAfter(row.scanIntervalHours, row.nextScanAt, now)
    : nextGeoScanAt(row.scanIntervalHours, now);
  const claimed = yield* geoDb("scan tick claim failed", () =>
    db
      .update(geoSettings)
      .set({ nextScanAt })
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
          nextScanAt: true,
        },
        where: and(
          eq(geoSettings.enabled, true),
          or(isNull(geoSettings.nextScanAt), lte(geoSettings.nextScanAt, now))
        ),
        orderBy: [
          desc(isNull(geoSettings.nextScanAt)),
          asc(geoSettings.nextScanAt),
        ],
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
    yield* geoLogInfo({
      event: "geo.scan.sweep",
      ...result,
      projectIds: dueRows.map((row) => row.projectId),
    });
    return result;
  }
);
