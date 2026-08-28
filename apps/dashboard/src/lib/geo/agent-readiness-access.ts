import { AGENT_READINESS_UNAVAILABLE_DESCRIPTION } from "@/constants/agent-readiness";
import { isAgentReadinessEnabledForOrganization } from "@/lib/geo/agent-readiness-flag";
import { forbidden } from "@/lib/orpc/utils/errors";

export async function assertAgentReadinessEnabled(
  organizationId: string
): Promise<void> {
  const enabled = await isAgentReadinessEnabledForOrganization(organizationId);
  if (!enabled) {
    throw forbidden(AGENT_READINESS_UNAVAILABLE_DESCRIPTION);
  }
}
