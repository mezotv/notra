import type { POSTHOG_GROUP_TYPES } from "@notra/posthog/constants/posthog";
import type { PostHogEventName } from "@notra/posthog/events";

export type PostHogPropertyValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[]
  | readonly number[];

export type PostHogProperties = Record<string, PostHogPropertyValue>;

export type PostHogGroupType =
  (typeof POSTHOG_GROUP_TYPES)[keyof typeof POSTHOG_GROUP_TYPES];

export type PostHogGroups = Partial<Record<PostHogGroupType, string>>;

export interface PostHogRequestContext {
  distinctId: string | null;
  sessionId: string | null;
}

export interface PostHogServerEventInput {
  event: PostHogEventName;
  distinctId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  sessionId?: string | null;
  properties?: PostHogProperties;
}

export interface PostHogServerExceptionInput {
  error: unknown;
  distinctId?: string | null;
  organizationId?: string | null;
  sessionId?: string | null;
  properties?: PostHogProperties;
}

export interface PostHogGroupIdentifyInput {
  groupType: PostHogGroupType;
  groupKey: string;
  properties?: PostHogProperties;
  distinctId?: string | null;
}

export interface PostHogPersonPropertiesInput {
  distinctId: string;
  set?: PostHogProperties;
  setOnce?: PostHogProperties;
}

export interface PostHogLlmMessage {
  role: string;
  content: string;
}

export interface PostHogLlmGenerationInput {
  distinctId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  traceId: string;
  sessionId?: string | null;
  spanName?: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  reasoningTokens?: number;
  latencySeconds?: number;
  isError?: boolean;
  error?: string | null;
  feature: string;
  input?: PostHogLlmMessage[];
  output?: PostHogLlmMessage[];
  privacyMode?: boolean;
  properties?: PostHogProperties;
}

export interface PostHogLlmTraceInput {
  distinctId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  traceId: string;
  sessionId?: string | null;
  spanName: string;
  latencySeconds?: number;
  isError?: boolean;
  error?: string | null;
  feature: string;
  properties?: PostHogProperties;
}

export interface PostHogTelemetryMetadataInput {
  distinctId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  sessionId?: string | null;
  feature: string;
  privacyMode?: boolean;
  properties?: Record<string, string | number | boolean | null | undefined>;
}

export type PostHogTelemetryMetadata = Record<
  string,
  string | number | boolean
>;
