import type { ContentGenerationWorkflowPayload } from "@notra/content-generation/schemas";
import { Client as WorkflowClient } from "@upstash/workflow";

interface ContentGenerationEnv {
  QSTASH_TOKEN?: string;
  CONTENT_GENERATION_WORKFLOW_URL?: string;
  CONTENT_GENERATION_WORKFLOW_BASE_URL?: string;
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getContentGenerationWorkflowUrl(env: ContentGenerationEnv) {
  if (env.CONTENT_GENERATION_WORKFLOW_URL) {
    return env.CONTENT_GENERATION_WORKFLOW_URL;
  }

  if (env.CONTENT_GENERATION_WORKFLOW_BASE_URL) {
    return `${trimTrailingSlash(env.CONTENT_GENERATION_WORKFLOW_BASE_URL)}/api/workflows/on-demand-content`;
  }

  return null;
}

export function isContentGenerationConfigured(env: ContentGenerationEnv) {
  return !!(env.QSTASH_TOKEN && getContentGenerationWorkflowUrl(env));
}

export async function triggerContentGenerationWorkflow(
  env: ContentGenerationEnv,
  payload: ContentGenerationWorkflowPayload
) {
  const token = env.QSTASH_TOKEN;
  const url = getContentGenerationWorkflowUrl(env);

  if (!token) {
    throw new Error("QSTASH_TOKEN is not configured");
  }

  if (!url) {
    throw new Error("Content generation workflow URL is not configured");
  }

  const client = new WorkflowClient({ token });
  const result = await client.trigger({
    url,
    body: payload,
  });

  return result.workflowRunId;
}
