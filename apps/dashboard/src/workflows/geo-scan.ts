import { geoScanWorkflowPayloadSchema } from "@notra/geo-core/schemas/geo";
import type { GeoScanResult } from "@notra/geo-core/types/geo";
import { flattenError } from "zod";

import type { GeoScanPayload } from "@/types/geo";

import { runGeoScanStep } from "./steps/geo-scan-steps";

export async function geoScanWorkflow(
  payload: GeoScanPayload
): Promise<GeoScanResult> {
  "use workflow";

  const parseResult = geoScanWorkflowPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error("[GEO] Invalid payload:", flattenError(parseResult.error));
    return { status: "invalid_payload" };
  }

  return await runGeoScanStep(
    parseResult.data.organizationId,
    parseResult.data.projectId,
    parseResult.data.claimedAt,
    parseResult.data.scanId
  );
}
