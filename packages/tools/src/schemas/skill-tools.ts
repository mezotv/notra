import { z } from "zod";

export const skillNameInputSchema = z.object({
  name: z.string().min(1),
});

export const listSkillsInputSchema = z.object({});

export const updateSkillInputSchema = z
  .object({
    name: z.string().min(1),
    content: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
  })
  .refine(
    (input) => input.content !== undefined || input.description !== undefined,
    { message: "Provide content or description to update" }
  );
