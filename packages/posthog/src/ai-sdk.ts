import type { LanguageModelV3 } from "@ai-sdk/provider";
import { POSTHOG_GROUP_TYPES } from "@notra/posthog/constants/posthog";
import { toAiSessionId } from "@notra/posthog/llm";
import {
  getPostHogServer,
  resolveServiceDistinctId,
} from "@notra/posthog/server";
import type { PostHogModelTracingOptions } from "@notra/posthog/types/ai-sdk";
import { withTracing } from "@posthog/ai/vercel";

function buildProperties(
  options: PostHogModelTracingOptions
): Record<string, string | number | boolean> {
  const properties: Record<string, string | number | boolean> = {};

  if (options.feature) {
    properties.feature = options.feature;
  }
  if (options.organizationId) {
    properties.organization_id = options.organizationId;
  }
  if (options.projectId) {
    properties.project_id = options.projectId;
  }
  if (options.sessionId) {
    properties.$ai_session_id = toAiSessionId(options.sessionId);
  }
  if (!options.distinctId) {
    properties.$process_person_profile = false;
  }
  for (const [key, value] of Object.entries(options.properties ?? {})) {
    if (value !== null && value !== undefined) {
      properties[key] = value;
    }
  }

  return properties;
}

function buildGroups(
  options: PostHogModelTracingOptions
): Record<string, string> | undefined {
  const groups: Record<string, string> = {};
  if (options.organizationId) {
    groups[POSTHOG_GROUP_TYPES.ORGANIZATION] = options.organizationId;
  }
  if (options.projectId) {
    groups[POSTHOG_GROUP_TYPES.PROJECT] = options.projectId;
  }
  return Object.keys(groups).length > 0 ? groups : undefined;
}

export function wrapModelWithPostHog<TModel extends LanguageModelV3>(
  model: TModel,
  options: PostHogModelTracingOptions = {}
): TModel {
  const client = getPostHogServer();
  if (!client) {
    return model;
  }

  return withTracing(model, client, {
    posthogDistinctId:
      options.distinctId ?? resolveServiceDistinctId(options.organizationId),
    posthogTraceId: options.traceId ?? undefined,
    posthogPrivacyMode: options.privacyMode ?? false,
    posthogGroups: buildGroups(options),
    posthogProperties: buildProperties(options),
  });
}
