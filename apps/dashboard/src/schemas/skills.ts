// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

export const skillNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(64, "Name must be 64 characters or fewer")
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
    "Name must be lowercase, start and end with a letter or digit, and contain only letters, digits, and hyphens"
  );

export const skillDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(500, "Description must be 500 characters or fewer");

export const skillContentSchema = z
  .string()
  .min(1, "Content is required")
  .max(200_000, "Content is too large");

export const createSkillSchema = z.object({
  name: skillNameSchema,
  description: skillDescriptionSchema,
  content: skillContentSchema,
});

export const updateSkillSchema = z.object({
  name: skillNameSchema.optional(),
  description: skillDescriptionSchema,
  content: skillContentSchema,
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
