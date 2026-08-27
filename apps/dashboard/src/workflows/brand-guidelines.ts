import type { BrandGuidelinesWorkflowPayload } from "@notra/ai/types/brand-guidelines";
import { flattenError } from "zod";

import { brandGuidelinesWorkflowPayloadSchema } from "@/schemas/brand-guidelines";
import {
  BRAND_GUIDELINE_STAGES,
  type BrandGuidelinesWorkflowResult,
} from "@/types/workflows/brand-guidelines";

import {
  markBrandGuidelineStageFailed,
  markBrandGuidelinesGenerating,
  markBrandGuidelinesUnexpectedFailure,
  runBrandGuidelineStage,
} from "./steps/brand-guidelines-steps";

export async function brandGuidelinesWorkflow(
  payload: BrandGuidelinesWorkflowPayload
): Promise<BrandGuidelinesWorkflowResult> {
  "use workflow";

  const parseResult = brandGuidelinesWorkflowPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error(
      "[Brand Guidelines] Invalid payload:",
      flattenError(parseResult.error)
    );
    return { status: "invalid_payload" };
  }
  const { brandSettingsId, organizationId, sourceUrl } = parseResult.data;

  try {
    await markBrandGuidelinesGenerating(brandSettingsId);

    for (const stage of BRAND_GUIDELINE_STAGES) {
      const result = await runBrandGuidelineStage({
        stage,
        brandSettingsId,
        sourceUrl,
      });

      if (!result.success) {
        await markBrandGuidelineStageFailed({
          brandSettingsId,
          error: result.error,
        });
        return { status: "stage_failed", stage };
      }
    }

    return { status: "completed" };
  } catch (error) {
    await markBrandGuidelinesUnexpectedFailure({
      brandSettingsId,
      organizationId,
    });
    throw error;
  }
}
