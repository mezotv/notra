import { gscSyncPayloadSchema } from "@notra/geo-core/schemas/google-search-console";
import type {
  GscSyncPayload,
  GscSyncResult,
} from "@notra/geo-core/types/google-search-console";
import { flattenError } from "zod";

import { runGscSyncStep } from "./steps/gsc-sync-steps";

export async function gscSyncWorkflow(
  payload: GscSyncPayload
): Promise<GscSyncResult> {
  "use workflow";

  const parseResult = gscSyncPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error("[GSC] Invalid payload:", flattenError(parseResult.error));
    return { status: "invalid_payload" };
  }

  return await runGscSyncStep(parseResult.data.organizationId);
}
