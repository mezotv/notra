import {
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from "@notra/ai/constants/languages";
import { supportedLanguageSchema } from "@notra/ai/schemas/language";
import {
  brandAudienceSchema,
  brandCompanyDescriptionSchema,
  brandCompanyNameSchema,
  brandCustomInstructionsSchema,
  brandCustomToneSchema,
  brandNameSchema,
} from "@notra/ai/schemas/limits";
import { toneProfileSchema } from "@notra/ai/schemas/tone";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export function getValidLanguage(value: unknown): SupportedLanguage {
  const parsed = supportedLanguageSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_LANGUAGE;
}

export const brandSettingsSchema = z.object({
  companyName: brandCompanyNameSchema,
  companyDescription: brandCompanyDescriptionSchema,
  toneProfile: toneProfileSchema,
  customTone: brandCustomToneSchema.nullable().optional(),
  customInstructions: brandCustomInstructionsSchema.nullable().optional(),
  audience: brandAudienceSchema,
  language: supportedLanguageSchema.default(DEFAULT_LANGUAGE),
});

export type BrandSettingsInput = z.infer<typeof brandSettingsSchema>;

export const analyzeBrandSchema = z.object({
  url: z.url("Please enter a valid URL"),
});

export type AnalyzeBrandInput = z.infer<typeof analyzeBrandSchema>;

export const updateBrandSettingsSchema = brandSettingsSchema
  .extend({
    id: z.string().optional(),
    name: brandNameSchema.optional(),
    websiteUrl: z.url().optional(),
  })
  .partial();

export type UpdateBrandSettingsInput = z.infer<
  typeof updateBrandSettingsSchema
>;

export const referenceTypeSchema = z.enum([
  "twitter_post",
  "linkedin_post",
  "blog_post",
  "custom",
]);

export type ReferenceType = z.infer<typeof referenceTypeSchema>;

export const applicableToSchema = z
  .array(z.enum(["all", "twitter", "linkedin", "blog"]))
  .min(1)
  .default(["all"]);

export type ApplicableTo = z.infer<typeof applicableToSchema>;

export const createReferenceSchema = z.object({
  type: referenceTypeSchema,
  content: z.string().min(1).max(10_000),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  note: z.string().nullable().optional(),
  applicableTo: applicableToSchema.optional(),
});

export type CreateReferenceInput = z.infer<typeof createReferenceSchema>;

export const updateReferenceSchema = z.object({
  note: z.string().nullable().optional(),
  content: z.string().min(1).optional(),
  applicableTo: applicableToSchema.optional(),
});

export type UpdateReferenceInput = z.infer<typeof updateReferenceSchema>;

export const fetchTweetSchema = z.object({
  url: z.string().min(1),
});

export const importTweetsSchema = z.object({
  accountId: z.string().min(1),
  maxResults: z.number().int().min(5).max(20).default(20),
});

export type ImportTweetsInput = z.infer<typeof importTweetsSchema>;

const brandIdentityWithWebsiteSchema = z
  .object({ websiteUrl: z.string().nullish() })
  .partial();

export const brandIdentityToolOutputSchema = z
  .object({
    brandIdentity: brandIdentityWithWebsiteSchema.nullish(),
    brandIdentities: z.array(brandIdentityWithWebsiteSchema).optional(),
  })
  .partial();
