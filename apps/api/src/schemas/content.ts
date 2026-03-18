import { z } from "@hono/zod-openapi";
import {
  LOOKBACK_WINDOWS,
  SUPPORTED_CONTENT_GENERATION_TYPES,
} from "@notra/content-generation/schemas";

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

export const getBrandIdentityParamsSchema = z.object({
  brandIdentityId: z
    .string()
    .trim()
    .min(1, "brandIdentityId is required")
    .openapi({
      param: {
        in: "path",
        name: "brandIdentityId",
      },
      example: "51c2f3aa-efdd-4e28-8e69-23fa2dfd3561",
    }),
});

export const errorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

export const organizationResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
});

export const brandIdentityResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
});

export const githubIntegrationResponseSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  owner: z.string().nullable(),
  repo: z.string().nullable(),
  defaultBranch: z.string().nullable(),
});

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
  organization: organizationResponseSchema,
  posts: z.array(postResponseSchema),
  pagination: postsPaginationSchema,
});

export const getPostResponseSchema = z.object({
  organization: organizationResponseSchema,
  post: postResponseSchema.nullable(),
});

export const patchPostRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional().openapi({
      example: "Ship notes for week 11",
    }),
    markdown: z.string().min(1).optional().openapi({
      example: "# Ship notes\n\nWe shipped a faster editor.",
    }),
    status: postStatusSchema.optional().openapi({
      example: "published",
    }),
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

export const patchPostResponseSchema = z.object({
  organization: organizationResponseSchema,
  post: postResponseSchema,
});

export const deletePostResponseSchema = z.object({
  id: z.string(),
  organization: organizationResponseSchema,
});

export const getBrandIdentitiesResponseSchema = z.object({
  organization: organizationResponseSchema,
  brandIdentities: z.array(brandIdentityResponseSchema),
});

export const getBrandIdentityResponseSchema = z.object({
  brandIdentity: brandIdentityResponseSchema.nullable(),
  organization: organizationResponseSchema,
});

export const getIntegrationsResponseSchema = z.object({
  github: z.array(githubIntegrationResponseSchema),
  slack: z.array(z.unknown()),
  linear: z.array(z.unknown()),
  organization: organizationResponseSchema,
});

export const generationQueueErrorResponseSchema = z.object({
  error: z.string(),
  jobId: z.string().optional(),
});

export const contentGenerationStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
]);

export const contentGenerationLookbackWindowSchema = z.enum(LOOKBACK_WINDOWS);

export const contentGenerationTypeSchema = z.enum(
  SUPPORTED_CONTENT_GENERATION_TYPES
);

export const createPostGenerationRequestSchema = z
  .object({
    contentType: contentGenerationTypeSchema.openapi({
      example: "blog_post",
    }),
    lookbackWindow: contentGenerationLookbackWindowSchema
      .default("last_7_days")
      .openapi({ example: "last_7_days" }),
    brandVoiceId: z.string().min(1).optional().openapi({
      example: "voice_123",
    }),
    brandIdentityId: z.string().min(1).nullable().optional().openapi({
      example: "voice_123",
    }),
    repositoryIds: z
      .array(z.string().min(1))
      .optional()
      .openapi({
        example: ["repo_1", "repo_2"],
      }),
    integrations: z
      .object({
        github: z
          .array(z.string().min(1))
          .min(1)
          .optional()
          .openapi({
            example: ["integration_1", "integration_2"],
          }),
      })
      .optional(),
    github: z
      .object({
        repositories: z
          .array(
            z.object({
              owner: z.string().min(1),
              repo: z.string().min(1),
            })
          )
          .min(1),
      })
      .optional()
      .openapi({
        example: {
          repositories: [{ owner: "usenotra", repo: "notra" }],
        },
      }),
    dataPoints: z
      .object({
        includePullRequests: z.boolean().default(true),
        includeCommits: z.boolean().default(true),
        includeReleases: z.boolean().default(true),
        includeLinearIssues: z.boolean().default(false),
      })
      .default({
        includePullRequests: true,
        includeCommits: true,
        includeReleases: true,
        includeLinearIssues: false,
      }),
    selectedItems: z
      .object({
        commitShas: z.array(z.string()).optional(),
        pullRequestNumbers: z
          .array(
            z.object({
              repositoryId: z.string(),
              number: z.number(),
            })
          )
          .optional(),
        releaseTagNames: z
          .array(
            z.union([
              z.string(),
              z.object({
                repositoryId: z.string(),
                tagName: z.string(),
              }),
            ])
          )
          .optional(),
      })
      .optional(),
  })
  .refine(
    (value) => {
      const repositorySourceCount = [
        value.repositoryIds?.length ? 1 : 0,
        value.integrations?.github?.length ? 1 : 0,
        value.github?.repositories?.length ? 1 : 0,
      ].reduce((sum, count) => sum + count, 0);

      return repositorySourceCount <= 1;
    },
    {
      message:
        "Provide only one repository selector: repositoryIds, integrations.github, or github.repositories",
      path: ["integrations"],
    }
  )
  .refine(
    (value) =>
      value.brandVoiceId === undefined || value.brandIdentityId === undefined,
    {
      message: "Provide either brandVoiceId or brandIdentityId, not both",
      path: ["brandIdentityId"],
    }
  );

export const contentGenerationJobEventSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  type: z.enum([
    "queued",
    "workflow_triggered",
    "running",
    "fetching_repositories",
    "generating_content",
    "post_created",
    "completed",
    "failed",
  ]),
  message: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export const contentGenerationJobSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  status: contentGenerationStatusSchema,
  contentType: contentGenerationTypeSchema,
  lookbackWindow: contentGenerationLookbackWindowSchema,
  repositoryIds: z.array(z.string()),
  brandVoiceId: z.string().nullable(),
  workflowRunId: z.string().nullable(),
  postId: z.string().nullable(),
  error: z.string().nullable(),
  source: z.enum(["api", "dashboard"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
});

export const createPostGenerationResponseSchema = z.object({
  organization: organizationResponseSchema,
  job: contentGenerationJobSchema,
});

export const getPostGenerationParamsSchema = z.object({
  jobId: z
    .string()
    .trim()
    .min(1, "jobId is required")
    .openapi({
      param: {
        in: "path",
        name: "jobId",
      },
      example: "job_123",
    }),
});

export const getPostGenerationResponseSchema = z.object({
  job: contentGenerationJobSchema,
  events: z.array(contentGenerationJobEventSchema),
});

export type GetPostsParams = z.infer<typeof getPostsParamsSchema>;
export type GetPostsQuery = z.infer<typeof getPostsQuerySchema>;
export type GetPostParams = z.infer<typeof getPostParamsSchema>;
export type GetBrandIdentityParams = z.infer<
  typeof getBrandIdentityParamsSchema
>;
export type PostResponse = z.infer<typeof postResponseSchema>;
export type GetPostsResponse = z.infer<typeof getPostsResponseSchema>;
export type GetPostResponse = z.infer<typeof getPostResponseSchema>;
export type GetBrandIdentityResponse = z.infer<
  typeof getBrandIdentityResponseSchema
>;
export type PatchPostRequest = z.infer<typeof patchPostRequestSchema>;
export type PatchPostResponse = z.infer<typeof patchPostResponseSchema>;
export type DeletePostResponse = z.infer<typeof deletePostResponseSchema>;
export type CreatePostGenerationRequest = z.infer<
  typeof createPostGenerationRequestSchema
>;
export type CreatePostGenerationResponse = z.infer<
  typeof createPostGenerationResponseSchema
>;
export type GetPostGenerationParams = z.infer<
  typeof getPostGenerationParamsSchema
>;
export type GetPostGenerationResponse = z.infer<
  typeof getPostGenerationResponseSchema
>;
