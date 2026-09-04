import { z } from "zod";

export const docolinSchema = z
  .looseObject({
    schema_version: z.number(),
    kind: z.string(),
    type: z.string(),
    applies_to: z.array(z.string()),
    language: z.string(),
    difficulty: z.string(),
    time_estimate: z.string(),
    status: z.string(),
    aliases: z.array(z.string()).optional(),
    next: z.string().optional(),
  })
  .optional();
