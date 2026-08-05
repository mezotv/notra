import { Effect } from "effect";
import { runGeoScan } from "@/lib/geo/scan";
import type { GeoScanResult } from "@/types/geo";

export async function runGeoScanStep(
  organizationId: string
): Promise<GeoScanResult> {
  "use step";
  return await Effect.runPromise(runGeoScan(organizationId));
}
