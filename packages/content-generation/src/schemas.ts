import type { contentTypeSchema } from "@notra/ai/schemas/content";
import { z } from "zod";

export const LOOKBACK_WINDOWS = [
  "current_day",
  "yesterday",
  "last_7_days",
  "last_14_days",
  "last_30_days",
] as const;

export const SUPPORTED_CONTENT_GENERATION_TYPES = [
  "changelog",
  "blog_post",
  "linkedin_post",
  "twitter_post",
] as const satisfies readonly z.infer<typeof contentTypeSchema>[];

export const lookbackWindowSchema = z.enum(LOOKBACK_WINDOWS);
export const onDemandContentTypeSchema = z.enum(
  SUPPORTED_CONTENT_GENERATION_TYPES
);

export const contentDataPointSettingsSchema = z.object({
  includePullRequests: z.boolean().default(true),
  includeCommits: z.boolean().default(true),
  includeReleases: z.boolean().default(true),
  includeLinearIssues: z.boolean().default(false),
});

export const selectedItemsSchema = z.object({
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
});

export const requestedGitHubRepositorySchema = z.object({
  owner: z.string().trim().min(1),
  repo: z.string().trim().min(1),
});

export const requestedGitHubRepositoriesSchema = z.object({
  repositories: z.array(requestedGitHubRepositorySchema).min(1),
});

export const requestedIntegrationsSchema = z.object({
  github: z.array(z.string().min(1)).min(1).optional(),
});

export const createContentGenerationRequestSchema = z
  .object({
    contentType: onDemandContentTypeSchema,
    lookbackWindow: lookbackWindowSchema.default("last_7_days"),
    brandVoiceId: z.string().min(1).optional(),
    brandIdentityId: z.string().min(1).nullable().optional(),
    repositoryIds: z.array(z.string().min(1)).optional(),
    integrations: requestedIntegrationsSchema.optional(),
    github: requestedGitHubRepositoriesSchema.optional(),
    dataPoints: contentDataPointSettingsSchema.prefault({}),
    selectedItems: selectedItemsSchema.optional(),
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

export const contentGenerationJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
]);

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
  metadata: z.record(z.string(), z.unknown()).nullable().default(null),
});

export const contentGenerationJobSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  status: contentGenerationJobStatusSchema,
  contentType: onDemandContentTypeSchema,
  lookbackWindow: lookbackWindowSchema,
  repositoryIds: z.array(z.string()),
  brandVoiceId: z.string().nullable(),
  workflowRunId: z.string().nullable(),
  postId: z.string().nullable(),
  error: z.string().nullable(),
  source: z.enum(["api", "dashboard"]).default("api"),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
});

export const contentGenerationWorkflowPayloadSchema = z.object({
  organizationId: z.string().min(1),
  runId: z.string().min(1),
  jobId: z.string().min(1).optional(),
  contentType: onDemandContentTypeSchema,
  lookbackWindow: lookbackWindowSchema,
  repositoryIds: z.array(z.string().min(1)).optional(),
  brandVoiceId: z.string().min(1).optional(),
  dataPoints: contentDataPointSettingsSchema,
  selectedItems: selectedItemsSchema.optional(),
  aiCreditReserved: z.boolean(),
  source: z.enum(["api", "dashboard"]).default("dashboard"),
});

export type LookbackWindow = z.infer<typeof lookbackWindowSchema>;
export type OnDemandContentType = z.infer<typeof onDemandContentTypeSchema>;
export type ContentDataPointSettings = z.infer<
  typeof contentDataPointSettingsSchema
>;
export type SelectedItems = z.infer<typeof selectedItemsSchema> | undefined;
export type CreateContentGenerationRequest = z.infer<
  typeof createContentGenerationRequestSchema
>;
export type ContentGenerationJobStatus = z.infer<
  typeof contentGenerationJobStatusSchema
>;
export type ContentGenerationJobEvent = z.infer<
  typeof contentGenerationJobEventSchema
>;
export type ContentGenerationJob = z.infer<typeof contentGenerationJobSchema>;
export type ContentGenerationWorkflowPayload = z.infer<
  typeof contentGenerationWorkflowPayloadSchema
>;
