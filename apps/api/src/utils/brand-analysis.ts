import type { BrandAnalysisJob } from "@notra/ai/jobs/brand-analysis";
import { Client as WorkflowClient } from "@upstash/workflow";

interface BrandAnalysisEnv {
  QSTASH_TOKEN?: string;
  WORKFLOW_BASE_URL?: string;
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getBrandAnalysisWorkflowUrl(env: BrandAnalysisEnv) {
  const baseUrl = env.WORKFLOW_BASE_URL;

  if (!baseUrl) {
    return null;
  }

  return `${trimTrailingSlash(baseUrl)}/api/workflows/brand-analysis`;
}

export function isBrandAnalysisConfigured(env: BrandAnalysisEnv) {
  return !!(env.QSTASH_TOKEN && getBrandAnalysisWorkflowUrl(env));
}

export async function triggerBrandAnalysisWorkflow(
  env: BrandAnalysisEnv,
  payload: {
    organizationId: string;
    url: string;
    voiceId: string;
    jobId: BrandAnalysisJob["id"];
  }
) {
  const token = env.QSTASH_TOKEN;
  const url = getBrandAnalysisWorkflowUrl(env);

  if (!token) {
    throw new Error("QSTASH_TOKEN is not configured");
  }

  if (!url) {
    throw new Error("Brand analysis workflow URL is not configured");
  }

  const client = new WorkflowClient({ token });
  const result = await client.trigger({
    url,
    body: payload,
  });

  return result.workflowRunId;
}
