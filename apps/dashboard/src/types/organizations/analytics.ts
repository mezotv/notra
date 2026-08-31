import type { PostHogEventName } from "@notra/posthog/events";
import type { PostHogProperties } from "@notra/posthog/types/posthog";

export interface OrganizationTrackingInput {
  event: PostHogEventName;
  userId: string;
  organizationId: string;
  properties?: PostHogProperties;
}
