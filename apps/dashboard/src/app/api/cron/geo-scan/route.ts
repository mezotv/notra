import { runGeoScanCronSweep } from "@notra/geo-core/geo/scan-schedule";
import { Effect } from "effect";

import { geoCoreDashboardLayer } from "@/lib/geo/configure";

/**
 * Vercel Cron entry point for scheduled GEO scans. The schedule is a due
 * stamp (`geo_settings.next_scan_at`) this sweep polls, so there is no
 * external message chain that can die and silently stop a project's scans:
 * a project the sweep misses is simply picked up on the next tick.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await Effect.runPromise(
    runGeoScanCronSweep().pipe(Effect.provide(geoCoreDashboardLayer))
  );
  return Response.json(result);
}
