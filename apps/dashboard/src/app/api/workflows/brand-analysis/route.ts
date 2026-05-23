import { SUPPORTED_LANGUAGES } from "@notra/ai/constants/languages";
import { gateway } from "@notra/ai/gateway";
import {
  setBrandAnalysisJobStatus,
  updateBrandAnalysisJob,
} from "@notra/ai/jobs/brand-analysis";
import { getBaseUrl } from "@notra/ai/qstash/triggers";
import type { FirecrawlScrapingResult } from "@notra/ai/types/firecrawl";
import { scrapeWebsiteForBrandAnalysis } from "@notra/ai/utils/firecrawl";
import { redis } from "@notra/ai/utils/redis";
import { buildExperimentalTelemetry } from "@notra/ai/utils/tcc";
import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { assertPublicHttpUrl } from "@notra/utils/url";
import type { WorkflowContext } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { generateText, Output } from "ai";
import { and, eq } from "drizzle-orm";
import { createRequestLogger } from "evlog";
import { createAILogger } from "evlog/ai";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { brandSettingsSchema, getValidLanguage } from "@/schemas/brand";
import type {
  BrandAnalysisPayload,
  ExtractionResult,
} from "@/types/brand-analysis";
import type { ProgressData } from "@/types/hooks/brand-analysis";
import {
  getStepFromCurrentStep,
  getStepFromStatus,
  updateDefaultBrandSettings,
} from "@/utils/brand-settings";

const PROGRESS_TTL = 300;

const brandAnalysisPayloadSchema = z.object({
  organizationId: z.string().min(1),
  url: z
    .string()
    .url()
    .superRefine((value, ctx) => {
      try {
        assertPublicHttpUrl(value);
      } catch (error) {
        ctx.addIssue({
          code: "custom",
          message: error instanceof Error ? error.message : "Invalid URL",
        });
      }
    }),
  voiceId: z.string().optional(),
  jobId: z.string().optional(),
});

const STEP_COUNT = 3;

async function setProgress(organizationId: string, data: ProgressData) {
  if (!redis) {
    return;
  }
  await redis.set(`brand:progress:${organizationId}`, data, {
    ex: PROGRESS_TTL,
  });
}

async function setJobProgress(jobId: string | undefined, data: ProgressData) {
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

export const { POST } = serve<BrandAnalysisPayload>(
  async (context: WorkflowContext<BrandAnalysisPayload>) => {
    const log = createRequestLogger({
      method: "POST",
      path: "/api/workflows/brand-analysis",
    });

    const parseResult = brandAnalysisPayloadSchema.safeParse(
      context.requestPayload
    );
    if (!parseResult.success) {
      console.error(
        "[Brand Analysis] Invalid payload:",
        z.flattenError(parseResult.error)
      );
      log.set({ feature: "brand_analysis", invalidPayload: true });
      log.emit();
      await context.cancel();
      return;
    }
    const { organizationId, url, voiceId, jobId } = parseResult.data;
    const ai = createAILogger(log);

    log.set({
      feature: "brand_analysis",
      organizationId,
      websiteUrl: url,
      voiceId: voiceId ?? null,
      jobId: jobId ?? null,
    });

    try {
      // Step 1: Scrape website
      await context.run("set-progress-scraping", async () => {
        const progress = {
          status: "scraping",
          currentStep: 1,
          totalSteps: STEP_COUNT,
        } satisfies ProgressData;
        await setProgress(organizationId, progress);
        await setJobProgress(jobId, progress);
      });

      const scrapingResult = await context.run<FirecrawlScrapingResult>(
        "scrape-website",
        async () => {
          return scrapeWebsiteForBrandAnalysis(url);
        }
      );

      if (!scrapingResult.success) {
        await context.run("set-progress-failed-scraping", async () => {
          const progress = {
            status: "failed",
            currentStep: 1,
            totalSteps: STEP_COUNT,
            error: scrapingResult.error,
          } satisfies ProgressData;
          await setProgress(organizationId, progress);
          await setJobProgress(jobId, progress);
        });
        await context.cancel();
        return;
      }

      // Step 2: Extract brand info
      await context.run("set-progress-extracting", async () => {
        const progress = {
          status: "extracting",
          currentStep: 2,
          totalSteps: STEP_COUNT,
        } satisfies ProgressData;
        await setProgress(organizationId, progress);
        await setJobProgress(jobId, progress);
      });

      const extractionResult = await context.run<ExtractionResult>(
        "extract-brand-info",
        async () => {
          try {
            const { output } = await generateText({
              model: ai.wrap(gateway("anthropic/claude-haiku-4.5")),
              output: Output.object({ schema: brandSettingsSchema }),
              prompt: `Analyze this website content and extract brand identity information.

Website content:
${scrapingResult.content}

Extract the following information:
1. companyName: The name of the company
2. companyDescription: A comprehensive description of what the company does, their mission, and what makes them unique (2-4 sentences)
3. toneProfile: The tone of their communication - choose one of: "Conversational", "Professional", "Casual", "Formal"
4. audience: A description of their target audience (1-2 sentences)
5. language: The primary language of the website content. Must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`,
              system: `You are a brand analyst expert. Your job is to analyze website content and extract key brand identity information. Be thorough but concise. Focus on understanding the company's essence, values, and how they communicate.`,
              experimental_telemetry: buildExperimentalTelemetry({
                feature: "brand_analysis",
                jobId,
                organizationId,
                routeName: "/api/workflows/brand-analysis",
                voiceId,
              }),
            });

            return { success: true, brandInfo: output };
          } catch (error) {
            console.error("Error extracting brand info:", error);
            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to extract brand information",
            };
          }
        }
      );

      if (!extractionResult.success) {
        await context.run("set-progress-failed-extracting", async () => {
          const progress = {
            status: "failed",
            currentStep: 2,
            totalSteps: STEP_COUNT,
            error: extractionResult.error,
          } satisfies ProgressData;
          await setProgress(organizationId, progress);
          await setJobProgress(jobId, progress);
        });
        await context.cancel();
        return;
      }

      // Step 3: Save to database
      await context.run("set-progress-saving", async () => {
        const progress = {
          status: "saving",
          currentStep: 3,
          totalSteps: STEP_COUNT,
        } satisfies ProgressData;
        await setProgress(organizationId, progress);
        await setJobProgress(jobId, progress);
      });

      await context.run("save-to-database", async () => {
        const brandInfo = extractionResult.brandInfo;

        const validatedLanguage = getValidLanguage(brandInfo.language);
        const brandData = {
          websiteUrl: url,
          companyName: brandInfo.companyName,
          companyDescription: brandInfo.companyDescription,
          toneProfile: brandInfo.toneProfile,
          customTone: brandInfo.customTone ?? null,
          audience: brandInfo.audience,
          language: validatedLanguage,
        };

        if (voiceId) {
          const target = await db.query.brandSettings.findFirst({
            where: and(
              eq(brandSettings.id, voiceId),
              eq(brandSettings.organizationId, organizationId)
            ),
          });

          if (target) {
            await db
              .update(brandSettings)
              .set(brandData)
              .where(eq(brandSettings.id, voiceId));
          } else {
            await updateDefaultBrandSettings(organizationId, brandData);
          }
        } else {
          await updateDefaultBrandSettings(organizationId, brandData);
        }
      });

      // Mark as completed
      await context.run("set-progress-completed", async () => {
        const progress = {
          status: "completed",
          currentStep: 3,
          totalSteps: STEP_COUNT,
        } satisfies ProgressData;
        await setProgress(organizationId, progress);
        await setJobProgress(jobId, progress);
      });

      return { success: true, brandInfo: extractionResult.brandInfo };
    } finally {
      log.emit();
    }
  },
  {
    baseUrl: getBaseUrl(),
    failureFunction: async ({ context, failStatus, failResponse }) => {
      const { organizationId } = context.requestPayload;

      // Set failed progress on workflow failure
      if (redis) {
        const progress = {
          status: "failed",
          currentStep: 0,
          totalSteps: STEP_COUNT,
          error: "Workflow failed unexpectedly",
        } satisfies ProgressData;

        await redis.set(`brand:progress:${organizationId}`, progress, {
          ex: PROGRESS_TTL,
        });

        await setJobProgress(context.requestPayload.jobId, progress);
      }

      console.error(
        `[Brand Analysis] Workflow failed for organization ${organizationId}:`,
        { status: failStatus, response: failResponse }
      );
    },
  }
);
