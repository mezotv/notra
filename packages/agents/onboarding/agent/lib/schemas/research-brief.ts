// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const researchBriefSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(
    z.object({
      topic: z.string().min(1),
      detail: z.string().min(1),
      quotes: z.array(z.string()),
      sources: z.array(z.string()),
    })
  ),
  unavailableSources: z.array(z.string()),
});
