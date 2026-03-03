// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/constants/languages";

export const supportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES);

export const toneProfileSchema = z.enum([
  "Conversational",
  "Professional",
  "Casual",
  "Formal",
]);

export type ToneProfile = z.infer<typeof toneProfileSchema>;

export function getValidToneProfile(
  value: unknown,
  fallback: ToneProfile = "Conversational"
): ToneProfile {
  const parsed = toneProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

export function getValidLanguage(value: unknown): SupportedLanguage {
  const parsed = supportedLanguageSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_LANGUAGE;
}

export const brandSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyDescription: z.string().min(10, "Please provide a description"),
  toneProfile: toneProfileSchema,
  customTone: z.string().nullable().optional(),
  customInstructions: z.string().nullable().optional(),
  audience: z.string().min(10, "Please describe your target audience"),
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
    name: z.string().min(1).optional(),
    websiteUrl: z.url().optional(),
  })
  .partial();

export type UpdateBrandSettingsInput = z.infer<
  typeof updateBrandSettingsSchema
>;
