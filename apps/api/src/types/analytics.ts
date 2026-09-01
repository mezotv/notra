import type { PostHogEventName } from "@notra/posthog/events";
import type { PostHogProperties } from "@notra/posthog/types/posthog";

import type {
  API_AUTH_KINDS,
  API_FEEDBACK_VIA,
  API_PAYWALL_FEATURES,
  API_SDK_BUCKETS,
} from "../constants/analytics";
import type { SerializedAgentFeedback } from "./feedback";

export type ApiSdkBucket =
  (typeof API_SDK_BUCKETS)[keyof typeof API_SDK_BUCKETS];

export type ApiAuthKind = (typeof API_AUTH_KINDS)[keyof typeof API_AUTH_KINDS];

export interface ApiSdkPattern {
  sdk: ApiSdkBucket;
  pattern: RegExp;
}

export interface ApiEventInput {
  event: PostHogEventName;
  organizationId?: string | null;
  projectId?: string | null;
  properties?: PostHogProperties;
}

export interface ApiKeyRejectedInput {
  authKind?: ApiAuthKind;
  status: number;
  reason: string;
  unkeyCode?: string;
}

export interface ApiPaywalledInput {
  feature: (typeof API_PAYWALL_FEATURES)[keyof typeof API_PAYWALL_FEATURES];
  status: number;
}

export interface ApiRateLimitedInput {
  limit: number;
}

export interface FeedbackReceivedInput {
  organizationId: string;
  feedback: SerializedAgentFeedback;
  deduplicated: boolean;
  via: (typeof API_FEEDBACK_VIA)[keyof typeof API_FEEDBACK_VIA];
}
