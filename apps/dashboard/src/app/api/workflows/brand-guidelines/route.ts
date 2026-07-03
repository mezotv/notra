import { getBaseUrl } from "@notra/ai/qstash/triggers";
import type { BrandGuidelinesWorkflowPayload } from "@notra/ai/types/brand-guidelines";
import type { WorkflowContext } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { createRequestLogger } from "evlog";
import { flattenError } from "zod";
import {
  applyBrandGuidelineBrandStep,
  applyBrandGuidelineScreenshotsStep,
  applyBrandGuidelineStyleguideStep,
  markBrandGuidelinesFailed,
  runBrandGuidelineStep,
  startBrandGuidelineGeneration,
} from "@/lib/brand-guidelines";
import { brandGuidelinesWorkflowPayloadSchema } from "@/schemas/brand-guidelines";
import type { BrandGuidelineWorkflowStepResult } from "@/types/brand-guidelines";

export const { POST } = serve<BrandGuidelinesWorkflowPayload>(
  async (context: WorkflowContext<BrandGuidelinesWorkflowPayload>) => {
    const log = createRequestLogger({
      method: "POST",
      path: "/api/workflows/brand-guidelines",
    });

    const parseResult = brandGuidelinesWorkflowPayloadSchema.safeParse(
      context.requestPayload
    );
    if (!parseResult.success) {
      console.error(
        "[Brand Guidelines] Invalid payload:",
        flattenError(parseResult.error)
      );
      log.set({ feature: "brand_guidelines", invalidPayload: true });
      log.emit();
      await context.cancel();
      return;
    }
    const { brandSettingsId, organizationId, sourceUrl } = parseResult.data;

    log.set({
      feature: "brand_guidelines",
      organizationId,
      brandSettingsId,
      sourceUrl,
    });

    try {
      await context.run("mark-generating", async () => {
        await startBrandGuidelineGeneration(brandSettingsId);
      });

      const steps = [
        {
          fallbackError: "Failed to extract colors and typography",
          name: "styleguide",
          run: () =>
            applyBrandGuidelineStyleguideStep({ brandSettingsId, sourceUrl }),
        },
        {
          fallbackError: "Failed to retrieve brand assets",
          name: "brand-assets",
          run: () =>
            applyBrandGuidelineBrandStep({ brandSettingsId, sourceUrl }),
        },
        {
          fallbackError: "Failed to capture website screenshots",
          name: "screenshots",
          run: () =>
            applyBrandGuidelineScreenshotsStep({ brandSettingsId, sourceUrl }),
        },
      ];

      for (const step of steps) {
        const result = await context.run<BrandGuidelineWorkflowStepResult>(
          step.name,
          () => runBrandGuidelineStep(step.run, step.fallbackError)
        );

        if (!result.success) {
          await context.run(`mark-failed-${step.name}`, async () => {
            await markBrandGuidelinesFailed({
              brandSettingsId,
              error: result.error,
            });
          });
          await context.cancel();
          return;
        }
      }
    } finally {
      log.emit();
    }
  },
  {
    baseUrl: getBaseUrl(),
    failureFunction: async ({ context, failStatus, failResponse }) => {
      const { brandSettingsId, organizationId } = context.requestPayload;

      if (brandSettingsId) {
        await markBrandGuidelinesFailed({
          brandSettingsId,
          error: "Guideline generation failed unexpectedly",
        });
      }

      console.error(
        `[Brand Guidelines] Workflow failed for organization ${organizationId}:`,
        { status: failStatus, response: failResponse }
      );
    },
  }
);
