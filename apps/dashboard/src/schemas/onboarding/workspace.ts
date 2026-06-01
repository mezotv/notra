// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  organizationNameSchema,
  organizationSlugSchema,
} from "@/schemas/organization";
import { optionalPublicWebsiteUrlSchema } from "@/schemas/url";

export const onboardingWorkspaceSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
  websiteUrl: optionalPublicWebsiteUrlSchema,
});

export type OnboardingWorkspaceInput = z.infer<
  typeof onboardingWorkspaceSchema
>;
