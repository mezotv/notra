import {
  deleteQstashMessage,
  publishQstashRoute,
} from "@notra/ai/qstash/triggers";

import { GEO_SCAN_WORKFLOW_PATH } from "../constants/geo";
import type { SyncGeoScanScheduleInput } from "../types/geo";

export async function syncGeoScanSchedule({
  organizationId,
  projectId,
  enabled,
  scanIntervalHours,
  existingMessageId,
  reschedule = false,
}: SyncGeoScanScheduleInput): Promise<string | null> {
  if (!enabled) {
    if (!existingMessageId) {
      return null;
    }
    try {
      await deleteQstashMessage(existingMessageId);
      return null;
    } catch (error) {
      console.error("[GEO] Failed to delete pending scan:", error);
      return existingMessageId;
    }
  }

  if (existingMessageId && !reschedule) {
    return existingMessageId;
  }

  return publishQstashRoute({
    path: GEO_SCAN_WORKFLOW_PATH,
    body: { organizationId, projectId },
    delaySeconds: scanIntervalHours * 60 * 60,
  });
}
