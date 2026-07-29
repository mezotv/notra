// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import {
  applicableToSchema,
  referenceSourceUrlSchema,
  referenceTypeSchema,
} from "@/schemas/brand";

const PERSONA_NAME_MAX_LENGTH = 120;
const PERSONA_TITLE_MAX_LENGTH = 160;
const PERSONA_BIO_MAX_LENGTH = 4000;
const PERSONA_CUSTOM_INSTRUCTIONS_MAX_LENGTH = 8000;
const PERSONA_SOCIAL_USERNAME_MAX_LENGTH = 120;
const PERSONA_REFERENCE_CONTENT_MAX_LENGTH = 10_000;
const PERSONA_REFERENCE_NOTE_MAX_LENGTH = 4000;

export const personaIdSchema = z.string().min(1);

export const personaSocialPlatformSchema = z.enum([
  "twitter",
  "linkedin",
  "github",
  "instagram",
  "youtube",
  "tiktok",
  "website",
]);

export const personaNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(PERSONA_NAME_MAX_LENGTH);

export const personaTitleSchema = z
  .string()
  .trim()
  .max(PERSONA_TITLE_MAX_LENGTH);

export const personaBioSchema = z.string().trim().max(PERSONA_BIO_MAX_LENGTH);

export const personaCustomInstructionsSchema = z
  .string()
  .trim()
  .max(PERSONA_CUSTOM_INSTRUCTIONS_MAX_LENGTH);

const personaAvatarUrlSchema = z.url({ protocol: /^https?$/ }).max(2048);

export const createPersonaSchema = z.object({
  name: personaNameSchema,
  title: personaTitleSchema.nullable().optional(),
  bio: personaBioSchema.nullable().optional(),
  avatarUrl: personaAvatarUrlSchema.nullable().optional(),
  customInstructions: personaCustomInstructionsSchema.nullable().optional(),
  memberId: z.string().min(1).nullable().optional(),
});

export const updatePersonaSchema = createPersonaSchema.partial();

export const personaSocialInputSchema = z.object({
  platform: personaSocialPlatformSchema,
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(PERSONA_SOCIAL_USERNAME_MAX_LENGTH),
  url: z
    .url({ protocol: /^https?$/ })
    .max(2048)
    .nullable()
    .optional(),
});

export const setPersonaSocialsSchema = z.object({
  socials: z
    .array(personaSocialInputSchema)
    .max(personaSocialPlatformSchema.options.length)
    .refine(
      (socials) =>
        new Set(socials.map((social) => social.platform)).size ===
        socials.length,
      { message: "Each platform can only be linked once" }
    ),
});

export const createPersonaReferenceSchema = z.object({
  type: referenceTypeSchema,
  content: z.string().min(1).max(PERSONA_REFERENCE_CONTENT_MAX_LENGTH),
  note: z.string().max(PERSONA_REFERENCE_NOTE_MAX_LENGTH).nullable().optional(),
  sourceUrl: referenceSourceUrlSchema.nullable().optional(),
  applicableTo: applicableToSchema.optional(),
});

export const updatePersonaReferenceSchema = z.object({
  content: z
    .string()
    .min(1)
    .max(PERSONA_REFERENCE_CONTENT_MAX_LENGTH)
    .optional(),
  note: z.string().max(PERSONA_REFERENCE_NOTE_MAX_LENGTH).nullable().optional(),
  sourceUrl: referenceSourceUrlSchema.nullable().optional(),
  applicableTo: applicableToSchema.optional(),
});
