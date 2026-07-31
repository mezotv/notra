import { toneProfileSchema } from "@notra/ai/schemas/tone";
import {
  applicablePlatformEnum,
  brandGuidelineColorRoleEnum,
  onboardingSuggestionTypeEnum,
  referenceTypeEnum,
} from "@notra/db/schema";
import { z } from "zod";
import { BRAND_PROFILE_FIELDS, MAX_BRAND_COLORS } from "../constants/brand";
import { SHA256_HEX_REGEX } from "../constants/reference-snapshot";
import { MEMORY_SEARCH_DEFAULT_LIMIT } from "../constants/supermemory";

export const referenceInputSchema = z
  .object({
    type: z.enum(referenceTypeEnum.enumValues),
    content: z.string().min(1).max(10_000),
    note: z.string().min(1).optional(),
    applicableTo: z
      .array(z.enum(applicablePlatformEnum.enumValues))
      .min(1)
      .optional(),
    sourceUrl: z
      .url({ protocol: /^https?$/ })
      .max(2048)
      .optional(),
    sourceSnapshotKey: z.string().min(1).optional(),
    sourceContentHash: z.string().regex(SHA256_HEX_REGEX).optional(),
    sourceCapturedAt: z.iso.datetime().optional(),
    authorName: z.string().min(1).nullish(),
    authorHandle: z.string().min(1).nullish(),
    title: z.string().min(1).nullish(),
    publishedAt: z.iso.datetime().nullish(),
    likes: z.number().int().min(0).nullish(),
    retweets: z.number().int().min(0).nullish(),
    replies: z.number().int().min(0).nullish(),
  })
  .refine(
    (reference) => reference.type === "custom" || Boolean(reference.sourceUrl),
    {
      message: "sourceUrl is required for non-custom references",
      path: ["sourceUrl"],
    }
  );

export const addReferenceInputSchema = referenceInputSchema;

export const addReferencesInputSchema = z.object({
  references: z.array(referenceInputSchema).min(1),
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
    toneProfile: toneProfileSchema.optional(),
    audience: z.string().min(1).optional(),
  })
  .refine(
    (input) => BRAND_PROFILE_FIELDS.some((field) => input[field] !== undefined),
    { message: "Provide at least one brand profile field to update" }
  );
