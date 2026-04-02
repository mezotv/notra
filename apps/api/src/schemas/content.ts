import { z } from "@hono/zod-openapi";
import { supportedLanguageSchema } from "@notra/ai/schemas/language";
import { POST_SLUG_MAX_LENGTH, POST_SLUG_REGEX } from "@notra/ai/schemas/post";
import { toneProfileSchema } from "@notra/ai/schemas/tone";
import {
  LOOKBACK_WINDOWS,
  SUPPORTED_CONTENT_GENERATION_TYPES,
} from "@notra/content-generation/schemas";

const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;
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

export const getIntegrationParamsSchema = z.object({
  integrationId: z
    .string()
    .trim()
    .min(1, "integrationId is required")
    .openapi({
      param: {
        in: "path",
        name: "integrationId",
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

const websiteUrlSchema = z
  .string()
  .trim()
  .min(1, "websiteUrl is required")
  .transform((value) =>
    HTTP_PROTOCOL_REGEX.test(value) ? value : `https://${value}`
  )
  .pipe(z.string().url("Invalid website URL"));

export const brandIdentityResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
  websiteUrl: z.string(),
  companyName: z.string().nullable(),
  companyDescription: z.string().nullable(),
  toneProfile: z.string().nullable(),
  customTone: z.string().nullable(),
  customInstructions: z.string().nullable(),
  audience: z.string().nullable(),
  language: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const githubIntegrationResponseSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  owner: z.string().nullable(),
  repo: z.string().nullable(),
  defaultBranch: z.string().nullable(),
});

export const linearIntegrationResponseSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  linearOrganizationId: z.string(),
  linearOrganizationName: z.string().nullable(),
  linearTeamId: z.string().nullable(),
  linearTeamName: z.string().nullable(),
});

const GITHUB_PAT_PREFIXES = [
  "ghp_",
  "github_pat_",
  "gho_",
  "ghu_",
  "ghs_",
  "ghr_",
] as const;

export const githubPersonalAccessTokenSchema = z
  .string()
  .trim()
  .min(1, "Personal access token is required")
  .refine(
    (value) => GITHUB_PAT_PREFIXES.some((prefix) => value.startsWith(prefix)),
    "Enter a valid GitHub personal access token"
  );

export const createGitHubIntegrationRequestSchema = z.object({
  owner: z.string().trim().min(1, "Repository owner is required"),
  repo: z.string().trim().min(1, "Repository name is required"),
  branch: z.string().trim().min(1).nullable().optional(),
  token: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, githubPersonalAccessTokenSchema.optional().nullable()),
});

export const createGitHubIntegrationResponseSchema = z.object({
  github: githubIntegrationResponseSchema,
  organization: organizationResponseSchema,
});

export const postResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().nullable(),
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
    slug: z
      .string()
      .trim()
      .min(1)
      .max(POST_SLUG_MAX_LENGTH)
      .regex(
        POST_SLUG_REGEX,
        "Slug must contain lowercase letters, numbers, and hyphens only"
      )
      .nullable()
      .optional()
      .openapi({
        example: "ship-notes-week-11",
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
      data.slug !== undefined ||
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

export const createBrandIdentityRequestSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().openapi({
    example: "Notra",
  }),
  websiteUrl: websiteUrlSchema.openapi({
    example: "https://usenotra.com",
  }),
});

export const brandAnalysisJobSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  brandIdentityId: z.string(),
  status: z.enum(["queued", "running", "completed", "failed"]),
  step: z.enum(["scraping", "extracting", "saving"]).nullable(),
  currentStep: z.number().int().min(0),
  totalSteps: z.number().int().min(1),
  workflowRunId: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
});

export const createBrandIdentityResponseSchema = z.object({
  organization: organizationResponseSchema,
  job: brandAnalysisJobSchema,
});

export const getBrandAnalysisJobParamsSchema = z.object({
  jobId: z
    .string()
    .trim()
    .min(1, "jobId is required")
    .openapi({
      param: {
        in: "path",
        name: "jobId",
      },
      example: "brand_job_123",
    }),
});

export const getBrandAnalysisJobResponseSchema = z.object({
  organization: organizationResponseSchema,
  job: brandAnalysisJobSchema,
});

export const patchBrandIdentityRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional().openapi({
      example: "Notra",
    }),
    websiteUrl: websiteUrlSchema.optional().openapi({
      example: "https://usenotra.com",
    }),
    companyName: z.string().trim().min(1).optional().nullable().openapi({
      example: "Notra",
    }),
    companyDescription: z
      .string()
      .trim()
      .min(10)
      .optional()
      .nullable()
      .openapi({
        example: "AI-native content workflows for software teams.",
      }),
    toneProfile: toneProfileSchema.optional().nullable().openapi({
      example: "Professional",
      description:
        "Set a preset tone profile. When provided without customTone, any saved custom tone is cleared.",
    }),
    customTone: z.string().trim().optional().nullable().openapi({
      example: "Clear, direct, and technically confident",
      description:
        "Provide a custom tone override. Send an empty string or null to clear it.",
    }),
    customInstructions: z.string().trim().optional().nullable().openapi({
      example: "Avoid hype. Prioritize concrete examples.",
    }),
    audience: z.string().trim().min(10).optional().nullable().openapi({
      example: "Engineering leaders and developer tooling teams.",
    }),
    language: supportedLanguageSchema.optional().nullable().openapi({
      example: "English",
    }),
    isDefault: z.literal(true).optional().openapi({
      example: true,
      description:
        "Set this brand identity as the organization's default. Only true is accepted.",
    }),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.websiteUrl !== undefined ||
      data.companyName !== undefined ||
      data.companyDescription !== undefined ||
      data.toneProfile !== undefined ||
      data.customTone !== undefined ||
      data.customInstructions !== undefined ||
      data.audience !== undefined ||
      data.language !== undefined ||
      data.isDefault !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

export const patchBrandIdentityResponseSchema = z.object({
  organization: organizationResponseSchema,
  brandIdentity: brandIdentityResponseSchema,
});

const disabledTriggerSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const deleteBrandIdentityResponseSchema = z.object({
  id: z.string(),
  organization: organizationResponseSchema,
  disabledSchedules: z.array(disabledTriggerSchema),
  disabledEvents: z.array(disabledTriggerSchema),
});

export const deletePostResponseSchema = z.object({
  id: z.string(),
  organization: organizationResponseSchema,
});

export const deleteIntegrationResponseSchema = z.object({
  id: z.string(),
  organization: organizationResponseSchema,
  disabledSchedules: z.array(disabledTriggerSchema),
  disabledEvents: z.array(disabledTriggerSchema),
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
  linear: z.array(linearIntegrationResponseSchema),
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
        description:
          "Deprecated. Use integrations.github with GitHub integration IDs instead.",
      }),
    linearIntegrationIds: z
      .array(z.string().min(1))
      .optional()
      .openapi({
        example: ["linear_integration_1"],
        description:
          "Deprecated. Use integrations.linear with Linear integration IDs instead.",
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
        linear: z
          .array(z.string().min(1))
          .min(1)
          .optional()
          .openapi({
            example: ["linear_integration_1"],
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
        includeLinearData: z.boolean().default(false),
      })
      .default({
        includePullRequests: true,
        includeCommits: true,
        includeReleases: true,
        includeLinearData: false,
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
        linearIssueIds: z
          .array(
            z.object({
              integrationId: z.string(),
              issueId: z.string(),
            })
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
        "Provide only one GitHub source selector: integrations.github or github.repositories. repositoryIds is deprecated.",
      path: ["integrations"],
    }
  )
  .refine(
    (value) => {
      const linearSourceCount = [
        value.linearIntegrationIds?.length ? 1 : 0,
        value.integrations?.linear?.length ? 1 : 0,
      ].reduce((sum, count) => sum + count, 0);

      return linearSourceCount <= 1;
    },
    {
      message:
        "Provide only one Linear source selector: integrations.linear. linearIntegrationIds is deprecated.",
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
export type CreateBrandIdentityRequest = z.infer<
  typeof createBrandIdentityRequestSchema
>;
export type CreateBrandIdentityResponse = z.infer<
  typeof createBrandIdentityResponseSchema
>;
export type GetBrandAnalysisJobParams = z.infer<
  typeof getBrandAnalysisJobParamsSchema
>;
export type GetBrandAnalysisJobResponse = z.infer<
  typeof getBrandAnalysisJobResponseSchema
>;
export type PatchBrandIdentityRequest = z.infer<
  typeof patchBrandIdentityRequestSchema
>;
export type PatchBrandIdentityResponse = z.infer<
  typeof patchBrandIdentityResponseSchema
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
