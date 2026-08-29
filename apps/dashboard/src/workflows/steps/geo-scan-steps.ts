import { flushGeoLog } from "@notra/ai/evlog";
import { Effect } from "effect";

import { runGeoScan } from "@/lib/geo/scan";
import type { GeoScanResult } from "@/types/geo";

export async function runGeoScanStep(
  organizationId: string,
  projectId?: string
): Promise<GeoScanResult> {
  "use step";
  try {
    return await Effect.runPromise(runGeoScan(organizationId, projectId));
  } finally {
    await flushGeoLog();
  }
}
