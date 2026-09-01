import { INTEGRATION_AUTH_KINDS } from "@/constants/integration-analytics";
import type { IntegrationAuthKind } from "@/types/analytics/integration-events";

export function toMcpIntegrationAuthKind(
  authType: string
): IntegrationAuthKind {
  if (authType === "oauth") {
    return INTEGRATION_AUTH_KINDS.OAUTH;
  }
  if (authType === "headers") {
    return INTEGRATION_AUTH_KINDS.HEADERS;
  }
  return INTEGRATION_AUTH_KINDS.PUBLIC;
}
