import { geoProjectSetupWorkflowPayloadSchema } from "@notra/geo-core/schemas/geo";
import { flattenError } from "zod";

import type {
  GeoProjectSetupPayload,
  GeoProjectSetupResult,
} from "@/types/geo";

import { runGeoProjectSetupStep } from "./steps/geo-project-setup-steps";

export async function geoProjectSetupWorkflow(
  payload: GeoProjectSetupPayload
): Promise<GeoProjectSetupResult> {
  "use workflow";

  const parsed = geoProjectSetupWorkflowPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    console.error(
      "[GEO Project Setup] Invalid payload:",
      flattenError(parsed.error)
    );
    return { status: "invalid_payload" };
  }

  try {
    await runGeoProjectSetupStep(parsed.data);
    return { status: "completed" };
  } catch (error) {
    console.error("[GEO Project Setup] Setup failed:", error);
    return { status: "failed" };
  }
}
