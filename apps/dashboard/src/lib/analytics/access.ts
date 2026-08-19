import { ANALYTICS_UNAVAILABLE_DESCRIPTION } from "@/constants/analytics";
import { isAnalyticsEnabledForOrganization } from "@/lib/analytics/flag";
import { forbidden } from "@/lib/orpc/utils/errors";

export async function assertAnalyticsEnabled(
  organizationId: string
): Promise<void> {
  const enabled = await isAnalyticsEnabledForOrganization(organizationId);
  if (!enabled) {
    throw forbidden(ANALYTICS_UNAVAILABLE_DESCRIPTION);
  }
}
