import { z } from "zod";

export const imageDesignerResultSchema = z.object({
  status: z
    .enum(["created", "updated", "failed"])
    .describe(
      "created for a new image post, updated for a revision, failed when generation was impossible"
    ),
  postId: z.string().nullable().default(null),
  title: z.string().nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  reason: z
    .string()
    .nullable()
    .default(null)
    .describe("Required for failed: a concise explanation of what went wrong"),
});
