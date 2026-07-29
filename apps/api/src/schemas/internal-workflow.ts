import { z } from "zod";

export const internalWorkflowStartResponseSchema = z.object({
  runId: z.string(),
});
