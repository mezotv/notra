import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import type { LogRetentionDays } from "@/types/webhooks/webhooks";

export async function checkLogRetention(
  organizationId: string
): Promise<LogRetentionDays> {
  if (!autumn) {
    return 30;
  }

  try {
    const thirtyDayCheck = await autumn.check({
      customerId: organizationId,
      featureId: FEATURES.LOG_RETENTION_30_DAYS,
    });

    if (thirtyDayCheck?.allowed) {
      return 30;
    }

    const fourteenDayCheck = await autumn.check({
      customerId: organizationId,
      featureId: FEATURES.LOG_RETENTION_14_DAYS,
    });

    if (fourteenDayCheck?.allowed) {
      return 14;
    }

    return 7;
  } catch {
    return 30;
  }
}
