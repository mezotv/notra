// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  organizationNameSchema,
  organizationSlugSchema,
} from "@/schemas/organization";

export const onboardingWorkspaceSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
  websiteUrl: z
    .string()
    .url("Please enter a valid URL (e.g., https://example.com)"),
});

export type OnboardingWorkspaceInput = z.infer<
  typeof onboardingWorkspaceSchema
>;
