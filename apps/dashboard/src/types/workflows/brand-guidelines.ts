export const BRAND_GUIDELINE_STAGES = [
  "styleguide",
  "brand-assets",
  "screenshots",
] as const;

export type BrandGuidelineStage = (typeof BRAND_GUIDELINE_STAGES)[number];

export interface BrandGuidelineStageInput {
  stage: BrandGuidelineStage;
  brandSettingsId: string;
  sourceUrl: string;
}

export type BrandGuidelinesWorkflowResult =
  | { status: "completed" }
  | { status: "invalid_payload" }
  | { status: "stage_failed"; stage: BrandGuidelineStage };
