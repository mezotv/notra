import type { z } from "zod";
import type { referenceInputSchema } from "../schemas/onboarding-tools";

export type ReferenceInput = z.infer<typeof referenceInputSchema>;
