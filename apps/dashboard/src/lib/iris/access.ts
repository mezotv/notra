import { IRIS_UNAVAILABLE_DESCRIPTION } from "@/constants/iris";
import { isIrisEnabledForOrganization } from "@/lib/iris/flag";
import { forbidden } from "@/lib/orpc/utils/errors";

export async function assertIrisEnabled(organizationId: string): Promise<void> {
  const enabled = await isIrisEnabledForOrganization(organizationId);
  if (!enabled) {
    throw forbidden(IRIS_UNAVAILABLE_DESCRIPTION);
  }
}
