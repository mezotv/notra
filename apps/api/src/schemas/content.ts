import { z } from "@hono/zod-openapi";

export const getPostsParamsSchema = z.object({});

export const postStatusSchema = z.enum(["draft", "published"]);
export const postContentTypeSchema = z.enum([
  "changelog",
  "linkedin_post",
  "twitter_post",
  "blog_post",
]);
export type PostStatus = z.infer<typeof postStatusSchema>;
export type PostContentType = z.infer<typeof postContentTypeSchema>;

export const ALL_POST_STATUSES = postStatusSchema.options;
export const ALL_POST_CONTENT_TYPES = postContentTypeSchema.options;

function normalizeFilterValues<T extends string>(
  values: T | T[] | undefined,
  defaultValues: readonly T[]
): T[] {
  if (!values) {
    return [...defaultValues];
  }

  const normalized = Array.isArray(values) ? values : [values];
  if (normalized.length === 0) {
    return [...defaultValues];
  }

  return Array.from(new Set(normalized));
}

function createQueryEnumFilterSchema<T extends string>(
  valueSchema: z.ZodType<T>,
  defaultValues: readonly T[],
  maxItems: number
) {
  return z
    .array(valueSchema)
    .max(maxItems)
    .optional()
    .transform((values: T[] | undefined) =>
      normalizeFilterValues(values, defaultValues)
    );
}

function createOpenApiEnumFilterSchema<T extends string>(
  valueSchema: z.ZodType<T>,
  defaultValues: readonly T[],
  maxItems: number,
  description: string
) {
  return z
    .union([valueSchema, z.array(valueSchema).max(maxItems)])
    .optional()
    .transform((values: T | T[] | undefined) =>
      normalizeFilterValues(values, defaultValues)
    )
    .openapi({ description });
}

const statusFilterSchema = createQueryEnumFilterSchema(
  postStatusSchema,
  ["published"],
  ALL_POST_STATUSES.length
);

const contentTypeFilterSchema = createQueryEnumFilterSchema(
  postContentTypeSchema,
  ALL_POST_CONTENT_TYPES,
  ALL_POST_CONTENT_TYPES.length
);

export const getPostsQuerySchema = z.object({
  sort: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
  status: statusFilterSchema,
  contentType: contentTypeFilterSchema,
});

const openApiStatusFilterSchema = createOpenApiEnumFilterSchema(
  postStatusSchema,
  ["published"],
  ALL_POST_STATUSES.length,
  "Filter by status. Repeat the query param to pass multiple values."
);

const openApiContentTypeFilterSchema = createOpenApiEnumFilterSchema(
  postContentTypeSchema,
  ALL_POST_CONTENT_TYPES,
  ALL_POST_CONTENT_TYPES.length,
  "Filter by content type. Repeat the query param to pass multiple values."
);

export const getPostsOpenApiQuerySchema = z.object({
  sort: z.enum(["asc", "desc"]).default("desc").openapi({
    description: "Sort by creation date",
    example: "desc",
  }),
  limit: z.coerce.number().int().min(1).max(100).default(10).openapi({
    description: "Items per page",
    example: 10,
  }),
  page: z.coerce.number().int().min(1).default(1).openapi({
    description: "Page number",
    example: 1,
  }),
  status: openApiStatusFilterSchema,
  contentType: openApiContentTypeFilterSchema,
});

export const getPostParamsSchema = z.object({
  postId: z
    .string()
    .trim()
    .min(1, "postId is required")
    .openapi({
      param: {
        in: "path",
        name: "postId",
      },
      example: "post_123",
    }),
});

export const errorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

export const postResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  markdown: z.string(),
  recommendations: z.string().nullable(),
  contentType: z.string(),
  sourceMetadata: z.unknown().nullable(),
  status: postStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
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
});

export const getPostResponseSchema = z.object({
  post: postResponseSchema.nullable(),
});

export const deletePostResponseSchema = z.object({
  id: z.string(),
});

export type GetPostsParams = z.infer<typeof getPostsParamsSchema>;
export type GetPostsQuery = z.infer<typeof getPostsQuerySchema>;
export type GetPostParams = z.infer<typeof getPostParamsSchema>;
export type PostResponse = z.infer<typeof postResponseSchema>;
export type GetPostsResponse = z.infer<typeof getPostsResponseSchema>;
export type GetPostResponse = z.infer<typeof getPostResponseSchema>;
export type DeletePostResponse = z.infer<typeof deletePostResponseSchema>;
