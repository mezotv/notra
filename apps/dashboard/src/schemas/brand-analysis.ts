import { publicWebsiteUrlSchema } from "@notra/geo-core/schemas/url";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

import { organizationNameSchema } from "@/schemas/organization";

export const onboardingBrandAnalysisSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  websiteUrl: publicWebsiteUrlSchema,
  name: organizationNameSchema.optional(),
});

export type OnboardingBrandAnalysisInput = z.infer<
  typeof onboardingBrandAnalysisSchema
>;
