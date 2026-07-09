import {
  applicablePlatformEnum,
  brandGuidelineColorRoleEnum,
  onboardingSuggestionTypeEnum,
  referenceTypeEnum,
} from "@notra/db/schema";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { BRAND_PROFILE_FIELDS, MAX_BRAND_COLORS } from "../constants/brand";
import { MEMORY_SEARCH_DEFAULT_LIMIT } from "../constants/supermemory";

export const addReferenceInputSchema = z.object({
  type: z.enum(referenceTypeEnum.enumValues),
  content: z.string().min(1),
  note: z.string().min(1).optional(),
  applicableTo: z
    .array(z.enum(applicablePlatformEnum.enumValues))
    .min(1)
    .optional(),
  sourceUrl: z.url().optional(),
});

export const addSuggestionInputSchema = z.object({
  type: z.enum(onboardingSuggestionTypeEnum.enumValues),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  evidence: z.string().min(1).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const saveBrandColorsInputSchema = z.object({
  colors: z
    .array(
      z.object({
        role: z.enum(brandGuidelineColorRoleEnum.enumValues),
        name: z.string().min(1).optional(),
        lightValue: z.string().min(1),
        darkValue: z.string().min(1).optional(),
        usage: z.string().min(1).optional(),
      })
    )
    .min(1)
    .max(MAX_BRAND_COLORS),
});

export const saveMemoryInputSchema = z.object({
  content: z.string().min(1),
  topic: z.string().min(1),
});

export const searchMemoryInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(20).default(MEMORY_SEARCH_DEFAULT_LIMIT),
});

export const updateBrandProfileInputSchema = z
  .object({
    companyName: z.string().min(1).optional(),
    companyDescription: z.string().min(1).optional(),
    toneProfile: z.string().min(1).optional(),
    audience: z.string().min(1).optional(),
  })
  .refine(
    (input) => BRAND_PROFILE_FIELDS.some((field) => input[field] !== undefined),
    { message: "Provide at least one brand profile field to update" }
  );
