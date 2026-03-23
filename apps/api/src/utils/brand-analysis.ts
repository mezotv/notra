import type { BrandAnalysisJob } from "@notra/ai/jobs/brand-analysis";
import { Client as WorkflowClient } from "@upstash/workflow";

interface BrandAnalysisEnv {
  QSTASH_TOKEN?: string;
  BRAND_ANALYSIS_WORKFLOW_URL?: string;
  BRAND_ANALYSIS_WORKFLOW_BASE_URL?: string;
  CONTENT_GENERATION_WORKFLOW_BASE_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  APP_URL?: string;
  BETTER_AUTH_URL?: string;
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getBrandAnalysisWorkflowUrl(env: BrandAnalysisEnv) {
  if (env.BRAND_ANALYSIS_WORKFLOW_URL) {
    return env.BRAND_ANALYSIS_WORKFLOW_URL;
  }

  const baseUrl =
    env.BRAND_ANALYSIS_WORKFLOW_BASE_URL ??
    env.CONTENT_GENERATION_WORKFLOW_BASE_URL ??
    env.NEXT_PUBLIC_APP_URL ??
    env.APP_URL ??
    env.BETTER_AUTH_URL;

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
