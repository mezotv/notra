// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const contentTypeSchema = z.enum([
  "changelog",
  "blog_post",
  "twitter_post",
  "linkedin_post",
  "investor_update",
]);

export const postStatusSchema = z.enum(["draft", "published"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

export type ContentType = z.infer<typeof contentTypeSchema>;

export const sourceMetadataSchema = z
  .object({
    triggerId: z.string(),
    triggerSourceType: z.string(),
    repositories: z.array(z.object({ owner: z.string(), repo: z.string() })),
    lookbackWindow: z.string(),
    lookbackRange: z.object({ start: z.string(), end: z.string() }),
  })
  .nullable()
  .optional();

export type SourceMetadata = z.infer<typeof sourceMetadataSchema>;

export const contentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  markdown: z.string(),
  contentType: contentTypeSchema,
  status: postStatusSchema,
  date: z.string(),
  sourceMetadata: sourceMetadataSchema,
});

export type ContentResponse = z.infer<typeof contentSchema>;

export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  markdown: z.string(),
  contentType: contentTypeSchema,
  status: postStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Post = z.infer<typeof postSchema>;

export const postsResponseSchema = z.object({
  posts: z.array(postSchema),
  nextCursor: z.string().nullable(),
});

export type PostsResponse = z.infer<typeof postsResponseSchema>;

export const editContentSchema = z.object({
  instruction: z.string().min(1, "Instruction is required"),
  currentMarkdown: z.string(),
  selectedText: z.string().optional(),
});

export type EditContentInput = z.infer<typeof editContentSchema>;

export const contextItemSchema = z.object({
  type: z.literal("github-repo"),
  owner: z.string(),
  repo: z.string(),
  integrationId: z.string(),
});

export type ContextItem = z.infer<typeof contextItemSchema>;

export const textSelectionSchema = z.object({
  text: z.string(),
  startLine: z.number(),
  startChar: z.number(),
  endLine: z.number(),
  endChar: z.number(),
});

export type TextSelection = z.infer<typeof textSelectionSchema>;

export const chatRequestSchema = z.object({
  messages: z.array(z.any()), // UIMessage from ai sdk
  currentMarkdown: z.string(),
  selection: textSelectionSchema.optional(),
  context: z.array(contextItemSchema).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const updateContentSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    markdown: z.string().min(1).optional(),
    status: postStatusSchema.optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.markdown !== undefined ||
      data.status !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

export type UpdateContentInput = z.infer<typeof updateContentSchema>;
