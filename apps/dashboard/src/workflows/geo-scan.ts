import { flattenError } from "zod";
import { geoOrganizationInputSchema } from "@/schemas/geo";
import type { GeoScanPayload, GeoScanResult } from "@/types/geo";
import { runGeoScanStep } from "./steps/geo-scan-steps";

export async function geoScanWorkflow(
  payload: GeoScanPayload
): Promise<GeoScanResult> {
  "use workflow";

  const parseResult = geoOrganizationInputSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error("[GEO] Invalid payload:", flattenError(parseResult.error));
    return { status: "invalid_payload" };
  }

  return await runGeoScanStep(
    parseResult.data.organizationId,
    parseResult.data.projectId
  );
}
