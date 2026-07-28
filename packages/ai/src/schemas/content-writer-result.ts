import { z } from "zod";

export const contentWriterResultSchema = z.object({
  status: z
    .enum(["created", "skipped", "failed"])
    .describe(
      "created when at least one post was saved; skipped when there was no meaningful source material; failed on actual errors, impossible requests, or tool failures"
    ),
  posts: z
    .array(
      z.object({
        postId: z.string(),
        title: z.string(),
        recommendations: z.string().nullable().default(null),
      })
    )
    .default([])
    .describe("Every post saved via create_post, in creation order"),
  reason: z
    .string()
    .nullable()
    .default(null)
    .describe(
      "Required for skipped and failed: a concise 1-2 sentence explanation based on the source data, never on brand/source name mismatch"
    ),
});
