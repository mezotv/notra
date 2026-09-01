import type { PostHogEventName } from "@notra/posthog/events";
import type { PostHogProperties } from "@notra/posthog/types/posthog";

export interface TrackServerEventInput {
  event: PostHogEventName;
  headers?: Headers | null;
  userId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  properties?: PostHogProperties;
}

export interface TrackServerExceptionInput {
  error: unknown;
  headers?: Headers | null;
  userId?: string | null;
  organizationId?: string | null;
  properties?: PostHogProperties;
}

export interface IdentifyOrganizationGroupInput {
  organizationId: string;
  properties: PostHogProperties;
  userId?: string | null;
}

export interface IdentifyProjectGroupInput {
  projectId: string;
  organizationId: string;
  properties: PostHogProperties;
  userId?: string | null;
}

export interface SetPersonPropertiesInput {
  userId: string;
  set?: PostHogProperties;
  setOnce?: PostHogProperties;
}
