import { flushGeoLog } from "@notra/ai/evlog";
import { retryGeoScan, runGeoScan } from "@notra/geo-core/geo/scan";
import type {
  GeoScanResult,
  GeoScanRunResult,
} from "@notra/geo-core/types/geo";
import { flushPostHogServer } from "@notra/posthog/server";
import { Effect } from "effect";
import { FatalError } from "workflow";

import { GEO_SCAN_FAILURE_REASONS } from "@/constants/geo-analytics";
import {
  describeScanFailure,
  trackGeoScanFailure,
  trackGeoScanStepResult,
} from "@/lib/analytics/geo-workflow-events";
import { geoCoreDashboardLayer } from "@/lib/geo/configure";

/**
 * `claimedAt` arrives as an ISO string because workflow payloads are JSON.
 * A value that does not parse is dropped rather than passed on: a bogus token
 * would fail every compare-and-set and silently disable the claim hand-back.
 */
function parseClaimedAt(claimedAt?: string): Date | undefined {
  if (!claimedAt) {
    return;
  }
  const parsed = new Date(claimedAt);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function runGeoScanStep(
  organizationId: string,
  projectId?: string,
  claimedAt?: string,
  scanId?: string
): Promise<GeoScanRunResult> {
  "use step";
  const startedAt = Date.now();
  try {
    const result = await Effect.runPromise(
      runGeoScan(
        organizationId,
        projectId,
        parseClaimedAt(claimedAt),
        scanId
      ).pipe(Effect.provide(geoCoreDashboardLayer))
    );
    await trackGeoScanStepResult({
      organizationId,
      projectId,
      scanId,
      result,
      durationMs: Date.now() - startedAt,
      retried: false,
    });
    return result;
  } catch (error) {
    await trackGeoScanFailure({
      organizationId,
      projectId,
      scanId,
      reason: describeScanFailure(error),
      durationMs: Date.now() - startedAt,
      retried: false,
    });
    throw error;
  } finally {
    await flushGeoLog();
    await flushPostHogServer();
  }
}

export async function retryGeoScanStep(
  organizationId: string,
  projectIds: string[],
  hadSuccessfulChecks: boolean
): Promise<GeoScanResult> {
  "use step";
  const startedAt = Date.now();
  try {
    const result = await Effect.runPromise(
      retryGeoScan(organizationId, projectIds).pipe(
        Effect.provide(geoCoreDashboardLayer)
      )
    );
    if (result.status === "retry_no_successful_checks") {
      if (!hadSuccessfulChecks && result.checks === 0) {
        const message = `GEO scan retry produced no successful checks for ${result.retryProjectIds.length} projects`;
        console.error(`[GEO] ${message}`);
        await trackGeoScanFailure({
          organizationId,
          reason: GEO_SCAN_FAILURE_REASONS.RETRY_NO_SUCCESSFUL_CHECKS,
          durationMs: Date.now() - startedAt,
          retried: true,
        });
        throw new FatalError(message);
      }
      const completed: GeoScanResult = {
        status: "completed",
        checks: result.checks,
        mentions: result.mentions,
      };
      await trackGeoScanStepResult({
        organizationId,
        result: completed,
        durationMs: Date.now() - startedAt,
        retried: true,
      });
      return completed;
    }
    await trackGeoScanStepResult({
      organizationId,
      result,
      durationMs: Date.now() - startedAt,
      retried: true,
    });
    return result;
  } finally {
    await flushGeoLog();
    await flushPostHogServer();
  }
}
