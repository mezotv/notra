import { POSTHOG_EVENTS } from "@notra/posthog/events";

import { trackServerEvent } from "@/lib/analytics/posthog-server";
import type {
  TrackIntegrationConnectedInput,
  TrackIntegrationConnectFailedInput,
} from "@/types/analytics/integration-events";

export function trackIntegrationConnected(
  input: TrackIntegrationConnectedInput
): void {
  trackServerEvent({
    event: POSTHOG_EVENTS.INTEGRATION_CONNECTED,
    headers: input.headers,
    userId: input.userId,
    organizationId: input.organizationId,
    properties: {
      provider: input.provider,
      auth_kind: input.authKind,
    },
  });
}

export function trackIntegrationConnectFailed(
  input: TrackIntegrationConnectFailedInput
): void {
  trackServerEvent({
    event: POSTHOG_EVENTS.INTEGRATION_CONNECT_FAILED,
    headers: input.headers,
    userId: input.userId,
    organizationId: input.organizationId,
    properties: {
      provider: input.provider,
      auth_kind: input.authKind,
      error_code: input.errorCode,
    },
  });
}
