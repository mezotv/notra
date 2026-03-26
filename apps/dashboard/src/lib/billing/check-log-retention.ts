import { FEATURES } from "@/constants/features";
import type { AutumnCheckResponse } from "@/types/autumn";
import type { LogRetentionDays } from "@/types/webhooks/webhooks";
import { autumn } from "./autumn";

export async function checkLogRetention(
  organizationId: string
): Promise<LogRetentionDays> {
  if (!autumn) {
    return 30;
  }

  let data: AutumnCheckResponse | null = null;
  try {
    data = await autumn.check({
      customerId: organizationId,
      featureId: FEATURES.LOG_RETENTION_30_DAYS,
    });
  } catch {
    return 30;
  }

  if (!data) {
    return 30;
  }

  return data.allowed ? 30 : 7;
}
