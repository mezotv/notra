// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const researchBriefSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(
    z.object({
      topic: z.string().min(1),
      detail: z.string().min(1),
      quotes: z.array(z.string().min(1)),
      sources: z.array(z.string().min(1)).min(1),
    })
  ),
  references: z
    .array(
      z.object({
        type: z.enum(["twitter_post", "linkedin_post", "blog_post"]),
        content: z.string().min(1),
        sourceUrl: z.url(),
        note: z.string().min(1),
        applicableTo: z
          .array(z.enum(["twitter", "linkedin", "blog", "all"]))
          .min(1),
      })
    )
    .max(50),
  unavailableSources: z.array(z.string()),
});
