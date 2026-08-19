import { z } from "zod";

const routerReasoningSchema = z
  .object({
    effort: z.enum(["low", "medium", "high"]).optional().catch(undefined),
    budgetTokens: z.number().optional().catch(undefined),
  })
  .catch({});

export const routerProviderOptionsSchema = z
  .object({
    caching: z.literal("auto").optional().catch(undefined),
    fallbackModels: z.array(z.string()).optional().catch(undefined),
    reasoning: routerReasoningSchema.optional().catch(undefined),
  })
  .catch({});
