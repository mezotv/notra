import {
  ANALYTICS_AUTH_METHODS,
  WORKOS_AUTH_METHOD_TO_ANALYTICS,
} from "@/constants/analytics-events";
import type { AnalyticsAuthMethod } from "@/types/analytics/events";

export function toAnalyticsAuthMethod(
  authenticationMethod: string | null | undefined
): AnalyticsAuthMethod {
  if (!authenticationMethod) {
    return ANALYTICS_AUTH_METHODS.UNKNOWN;
  }
  return (
    WORKOS_AUTH_METHOD_TO_ANALYTICS[authenticationMethod] ??
    ANALYTICS_AUTH_METHODS.UNKNOWN
  );
}
