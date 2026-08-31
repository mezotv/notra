import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { captureServerEvent } from "@notra/posthog/server";
import type {
  PostHogLlmGenerationInput,
  PostHogLlmTraceInput,
  PostHogProperties,
  PostHogTelemetryMetadata,
  PostHogTelemetryMetadataInput,
} from "@notra/posthog/types/posthog";

const AI_SESSION_ID_PATTERN = /[^a-zA-Z0-9\-_~.@()!':|]/g;

export function toAiSessionId(value: string): string {
  return value.replace(AI_SESSION_ID_PATTERN, "_");
}

function serializeMessages(
  messages: PostHogLlmGenerationInput["input"]
): string | undefined {
  if (!messages || messages.length === 0) {
    return undefined;
  }
  return JSON.stringify(messages);
}

export function capturePostHogLlmGeneration(
  input: PostHogLlmGenerationInput
): void {
  const properties: PostHogProperties = {
    ...input.properties,
    $ai_trace_id: input.traceId,
    $ai_session_id: input.sessionId
      ? toAiSessionId(input.sessionId)
      : undefined,
    $ai_span_name: input.spanName,
    $ai_model: input.model,
    $ai_provider: input.provider,
    $ai_input_tokens: input.inputTokens,
    $ai_output_tokens: input.outputTokens,
    $ai_cache_read_input_tokens: input.cacheReadTokens,
    $ai_cache_creation_input_tokens: input.cacheWriteTokens,
    $ai_reasoning_tokens: input.reasoningTokens,
    $ai_latency: input.latencySeconds,
    $ai_is_error: input.isError ?? false,
    $ai_error: input.error ?? undefined,
    feature: input.feature,
  };

  if (input.privacyMode) {
    properties.$ai_privacy_mode = true;
  } else {
    properties.$ai_input = serializeMessages(input.input);
    properties.$ai_output_choices = serializeMessages(input.output);
  }

  captureServerEvent({
    event: POSTHOG_EVENTS.AI_GENERATION,
    distinctId: input.distinctId,
    organizationId: input.organizationId,
    projectId: input.projectId,
    properties,
  });
}

export function capturePostHogLlmTrace(input: PostHogLlmTraceInput): void {
  captureServerEvent({
    event: POSTHOG_EVENTS.AI_TRACE,
    distinctId: input.distinctId,
    organizationId: input.organizationId,
    projectId: input.projectId,
    properties: {
      ...input.properties,
      $ai_trace_id: input.traceId,
      $ai_session_id: input.sessionId
        ? toAiSessionId(input.sessionId)
        : undefined,
      $ai_span_name: input.spanName,
      $ai_latency: input.latencySeconds,
      $ai_is_error: input.isError ?? false,
      $ai_error: input.error ?? undefined,
      feature: input.feature,
    },
  });
}

export function buildPostHogTelemetryMetadata(
  input: PostHogTelemetryMetadataInput
): PostHogTelemetryMetadata {
  const metadata: PostHogTelemetryMetadata = {
    posthog_feature: input.feature,
  };

  if (input.distinctId) {
    metadata.posthog_distinct_id = input.distinctId;
  }
  if (input.organizationId) {
    metadata.posthog_organization_id = input.organizationId;
  }
  if (input.projectId) {
    metadata.posthog_project_id = input.projectId;
  }
  if (input.sessionId) {
    metadata.$ai_session_id = toAiSessionId(input.sessionId);
  }
  if (input.privacyMode) {
    metadata.posthog_privacy_mode = true;
  }
  for (const [key, value] of Object.entries(input.properties ?? {})) {
    if (value !== null && value !== undefined) {
      metadata[`posthog_${key}`] = value;
    }
  }

  return metadata;
}
