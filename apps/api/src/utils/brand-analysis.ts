import type { BrandAnalysisJob } from "@notra/ai/jobs/brand-analysis";

import {
  getInternalWorkflowUrl,
  startDashboardWorkflow,
} from "./internal-workflow";

interface BrandAnalysisEnv {
  WORKFLOW_BASE_URL?: string;
}

function getBrandAnalysisWorkflowUrl(env: BrandAnalysisEnv) {
  return getInternalWorkflowUrl(env, "/api/internal/workflows/brand-analysis");
}

export function isBrandAnalysisConfigured(env: BrandAnalysisEnv) {
  return !!getBrandAnalysisWorkflowUrl(env);
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
  const url = getBrandAnalysisWorkflowUrl(env);

  if (!url) {
    throw new Error("Brand analysis workflow URL is not configured");
  }

  return await startDashboardWorkflow(url, payload);
}
