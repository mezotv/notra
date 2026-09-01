import { publicWebsiteUrlSchema } from "@notra/geo-core/schemas/url";
import { flattenError, object, string } from "zod";

import type { BrandAnalysisPayload } from "@/types/brand-analysis";
import type { BrandAnalysisWorkflowResult } from "@/types/workflows/brand-analysis";

import {
  extractBrandInfo,
  saveBrandSettingsFromAnalysis,
  scrapeBrandWebsite,
  setBrandAnalysisProgress,
} from "./steps/brand-analysis-steps";

const STEP_COUNT = 3;

export const brandAnalysisPayloadSchema = object({
  organizationId: string().min(1),
  url: publicWebsiteUrlSchema,
  voiceId: string().optional(),
  jobId: string().optional(),
});

export async function brandAnalysisWorkflow(
  payload: BrandAnalysisPayload
): Promise<BrandAnalysisWorkflowResult> {
  "use workflow";

  const parseResult = brandAnalysisPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error(
      "[Brand Analysis] Invalid payload:",
      flattenError(parseResult.error)
    );
    return { status: "invalid_payload" };
  }
  const { organizationId, url, voiceId, jobId } = parseResult.data;
  const workflowStartedAt = Date.now();

  try {
    await setBrandAnalysisProgress({
      organizationId,
      jobId,
      startedAt: workflowStartedAt,
      progress: { status: "scraping", currentStep: 1, totalSteps: STEP_COUNT },
    });

    const scrapingResult = await scrapeBrandWebsite(url);
    if (!scrapingResult.success) {
      await setBrandAnalysisProgress({
        organizationId,
        jobId,
        startedAt: workflowStartedAt,
        progress: {
          status: "failed",
          currentStep: 1,
          totalSteps: STEP_COUNT,
          error: scrapingResult.error,
        },
      });
      return { status: "scraping_failed" };
    }

    await setBrandAnalysisProgress({
      organizationId,
      jobId,
      startedAt: workflowStartedAt,
      progress: {
        status: "extracting",
        currentStep: 2,
        totalSteps: STEP_COUNT,
      },
    });

    const extractionResult = await extractBrandInfo({
      content: scrapingResult.content,
      organizationId,
      jobId,
      voiceId,
    });
    if (!extractionResult.success) {
      await setBrandAnalysisProgress({
        organizationId,
        jobId,
        startedAt: workflowStartedAt,
        progress: {
          status: "failed",
          currentStep: 2,
          totalSteps: STEP_COUNT,
          error: extractionResult.error,
        },
      });
      return { status: "extraction_failed" };
    }

    await setBrandAnalysisProgress({
      organizationId,
      jobId,
      startedAt: workflowStartedAt,
      progress: { status: "saving", currentStep: 3, totalSteps: STEP_COUNT },
    });

    await saveBrandSettingsFromAnalysis({
      organizationId,
      voiceId,
      url,
      brandInfo: extractionResult.brandInfo,
    });

    await setBrandAnalysisProgress({
      organizationId,
      jobId,
      startedAt: workflowStartedAt,
      progress: {
        status: "completed",
        currentStep: 3,
        totalSteps: STEP_COUNT,
      },
    });

    return { status: "completed", brandInfo: extractionResult.brandInfo };
  } catch (error) {
    await setBrandAnalysisProgress({
      organizationId,
      jobId,
      startedAt: workflowStartedAt,
      progress: {
        status: "failed",
        currentStep: 0,
        totalSteps: STEP_COUNT,
        error: "Workflow failed unexpectedly",
      },
    });
    console.error(
      `[Brand Analysis] Workflow failed for organization ${organizationId}`
    );
    throw error;
  }
}
