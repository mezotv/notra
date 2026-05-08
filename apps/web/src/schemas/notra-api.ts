import { z } from "zod";

const notraApiPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  markdown: z.string(),
  recommendations: z.string().nullable(),
  contentType: z.string(),
  sourceMetadata: z.unknown().optional(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  slug: z.string().nullable().optional(),
});

export type NotraApiPost = z.infer<typeof notraApiPostSchema>;

export const notraApiListPostsResponseSchema = z.object({
  posts: z.array(notraApiPostSchema),
});
