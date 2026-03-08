import { z } from "zod";

export const clearCompletedGenerationSchema = z.object({
  runId: z.string().min(1),
});
