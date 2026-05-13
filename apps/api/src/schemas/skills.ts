import { z } from "@hono/zod-openapi";
import {
  SKILL_CONTENT_MAX_LENGTH,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  SKILL_NAME_REGEX,
} from "../constants/skills";

const skillNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(
    SKILL_NAME_MAX_LENGTH,
    `Name must be ${SKILL_NAME_MAX_LENGTH} characters or fewer`
  )
  .regex(
    SKILL_NAME_REGEX,
    "Name must be lowercase, start and end with a letter or digit, and contain only letters, digits, and hyphens"
  )
  .openapi({
    description: "Skill name. Lowercase letters, digits, and hyphens only.",
    example: "humanizer",
  });

const skillDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(
    SKILL_DESCRIPTION_MAX_LENGTH,
    `Description must be ${SKILL_DESCRIPTION_MAX_LENGTH} characters or fewer`
  )
  .openapi({
    description: "Short description of when the skill should be used.",
    example: "Polish near-final drafts so they sound natural and specific.",
  });

const skillContentSchema = z
  .string()
  .min(1, "Content is required")
  .max(SKILL_CONTENT_MAX_LENGTH, "Content is too large")
  .openapi({
    description: "Full skill instructions, typically Markdown.",
  });

export const skillParamsSchema = z.object({
  name: skillNameSchema,
});

export const createSkillRequestSchema = z
  .object({
    name: skillNameSchema,
    description: skillDescriptionSchema,
    content: skillContentSchema,
  })
  .openapi("CreateSkillRequest");

export const patchSkillRequestSchema = z
  .object({
    name: skillNameSchema.optional(),
    description: skillDescriptionSchema.optional(),
    content: skillContentSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  })
  .openapi("PatchSkillRequest");

const skillSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    isSystem: z.boolean(),
    updatedAt: z.string(),
  })
  .openapi("SkillSummary");

const skillSchema = skillSummarySchema
  .extend({
    content: z.string(),
    createdAt: z.string(),
  })
  .openapi("Skill");

export const listSkillsResponseSchema = z
  .object({
    skills: z.array(skillSummarySchema),
  })
  .openapi("ListSkillsResponse");

export const skillResponseSchema = z
  .object({
    skill: skillSchema,
  })
  .openapi("SkillResponse");

export const createSkillResponseSchema = z
  .object({
    skill: skillSchema,
  })
  .openapi("CreateSkillResponse");

export const patchSkillResponseSchema = z
  .object({
    skill: skillSchema,
  })
  .openapi("PatchSkillResponse");

export const deleteSkillResponseSchema = z
  .object({
    success: z.literal(true),
  })
  .openapi("DeleteSkillResponse");
