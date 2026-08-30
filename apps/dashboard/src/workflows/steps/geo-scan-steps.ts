import { flushGeoLog } from "@notra/ai/evlog";
import { runGeoScan } from "@notra/geo-core/geo/scan";
import type { GeoScanResult } from "@notra/geo-core/types/geo";
import { Effect } from "effect";

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
): Promise<GeoScanResult> {
  "use step";
  try {
    return await Effect.runPromise(
      runGeoScan(
        organizationId,
        projectId,
        parseClaimedAt(claimedAt),
        scanId
      ).pipe(Effect.provide(geoCoreDashboardLayer))
    );
  } finally {
    await flushGeoLog();
  }
}
