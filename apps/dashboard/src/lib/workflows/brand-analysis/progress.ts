import {
  setBrandAnalysisJobStatus,
  updateBrandAnalysisJob,
} from "@notra/ai/jobs/brand-analysis";
import { redis } from "@notra/ai/utils/redis";

import type { ProgressData } from "@/types/hooks/brand-analysis";
import {
  getStepFromCurrentStep,
  getStepFromStatus,
} from "@/utils/brand-settings";

const PROGRESS_TTL = 300;

export async function setProgress(organizationId: string, data: ProgressData) {
  if (!redis) {
    return;
  }
  await redis.set(`brand:progress:${organizationId}`, data, {
    ex: PROGRESS_TTL,
  });
}

export async function setJobProgress(
  jobId: string | undefined,
  data: ProgressData
) {
  if (!(redis && jobId)) {
    return;
  }

  if (data.status === "failed") {
    await setBrandAnalysisJobStatus(redis, jobId, "failed", {
      step: getStepFromCurrentStep(data),
      currentStep: data.currentStep,
      totalSteps: data.totalSteps,
      error: data.error ?? "Brand analysis failed",
    });
    return;
  }

  if (data.status === "completed") {
    await setBrandAnalysisJobStatus(redis, jobId, "completed", {
      step: null,
      currentStep: data.currentStep,
      totalSteps: data.totalSteps,
      error: null,
    });
    return;
  }

  await updateBrandAnalysisJob(redis, jobId, {
    status: "running",
    step: getStepFromStatus(data.status),
    currentStep: data.currentStep,
    totalSteps: data.totalSteps,
    error: null,
  });
}
