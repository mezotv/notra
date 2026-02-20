// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const getPostsParamsSchema = z.object({
  organizationId: z.string().trim().min(1, "organizationId is required"),
});

const postStatusSchema = z.enum(["draft", "published"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

const statusFilterSchema = z
  .array(postStatusSchema)
  .max(2)
  .optional()
  .transform((statuses): PostStatus[] =>
    statuses && statuses.length > 0
      ? Array.from(new Set(statuses))
      : ["published"]
  );

export const getPostsQuerySchema = z.object({
  sort: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
  status: statusFilterSchema,
});

export const getPostParamsSchema = z.object({
  organizationId: z.string().trim().min(1, "organizationId is required"),
  postId: z.string().trim().min(1, "postId is required"),
});

export const getPostQuerySchema = z.object({
  status: statusFilterSchema,
});

export const postResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  markdown: z.string(),
  contentType: z.string(),
  sourceMetadata: z.unknown().nullable(),
  status: postStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const postsResponseMetadataSchema = z.object({
  status: z.array(postStatusSchema),
});

export const postsPaginationSchema = z.object({
  limit: z.number().int().min(1),
  currentPage: z.number().int().min(1),
  nextPage: z.number().int().min(1).nullable(),
  previousPage: z.number().int().min(1).nullable(),
  totalPages: z.number().int().min(1),
  totalItems: z.number().int().min(0),
});

export const getPostsResponseSchema = z.object({
  posts: z.array(postResponseSchema),
  pagination: postsPaginationSchema,
  metadata: postsResponseMetadataSchema,
});

export const getPostResponseSchema = z.object({
  post: postResponseSchema.nullable(),
  metadata: postsResponseMetadataSchema,
});

export type GetPostsParams = z.infer<typeof getPostsParamsSchema>;
export type GetPostsQuery = z.infer<typeof getPostsQuerySchema>;
export type GetPostParams = z.infer<typeof getPostParamsSchema>;
export type GetPostQuery = z.infer<typeof getPostQuerySchema>;
export type PostResponse = z.infer<typeof postResponseSchema>;
export type GetPostsResponse = z.infer<typeof getPostsResponseSchema>;
export type GetPostResponse = z.infer<typeof getPostResponseSchema>;
