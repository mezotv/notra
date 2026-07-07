// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const skillEditsSchema = z.object({
  editsApplied: z.array(
    z.object({
      skillName: z.string(),
      change: z.string(),
    })
  ),
  skipped: z.array(z.string()),
});
