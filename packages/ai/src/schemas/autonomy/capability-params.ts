import {
  IRIS_CAPABILITY_ANALYTICS_READ,
  IRIS_CAPABILITY_BLOG_POST_CREATE,
  IRIS_CAPABILITY_CHANGELOG_CREATE,
  IRIS_CAPABILITY_EXPERIMENT_CREATE,
  IRIS_CAPABILITY_EXPERIMENT_READ,
  IRIS_CAPABILITY_SOCIAL_POST_CREATE,
  IRIS_CAPABILITY_SOURCE_GITHUB_READ,
  IRIS_EXPERIMENT_DEFAULT_METRIC,
  IRIS_EXPERIMENT_DEFAULT_PROVIDER,
  IRIS_MAX_BLOG_POST_IMAGES,
  IRIS_MIN_IMAGES_PER_POST,
} from "@notra/ai/constants/autonomy-capabilities";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const IRIS_TOPIC_MAX_LENGTH = 300;

export const irisContentTaskParamsSchema = z.object({
  topic: z.string().min(1).max(IRIS_TOPIC_MAX_LENGTH),
  angle: z.string().max(600).optional(),
  audience: z.string().max(200).optional(),
});
export type IrisContentTaskParams = z.infer<typeof irisContentTaskParamsSchema>;

export const irisBlogPostTaskParamsSchema = irisContentTaskParamsSchema.extend({
  imageCount: z
    .number()
    .int()
    .min(IRIS_MIN_IMAGES_PER_POST)
    .max(IRIS_MAX_BLOG_POST_IMAGES)
    .default(IRIS_MIN_IMAGES_PER_POST),
});
export type IrisBlogPostTaskParams = z.infer<
  typeof irisBlogPostTaskParamsSchema
>;

export const irisSocialPlatformSchema = z.enum(["twitter", "linkedin"]);
export type IrisSocialPlatform = z.infer<typeof irisSocialPlatformSchema>;

export const irisSocialPostTaskParamsSchema =
  irisContentTaskParamsSchema.extend({
    platform: irisSocialPlatformSchema,
  });
export type IrisSocialPostTaskParams = z.infer<
  typeof irisSocialPostTaskParamsSchema
>;

export const irisSourceReadTaskParamsSchema = z.object({
  focus: z.string().max(IRIS_TOPIC_MAX_LENGTH).optional(),
});
export type IrisSourceReadTaskParams = z.infer<
  typeof irisSourceReadTaskParamsSchema
>;

export const irisAnalyticsReadTaskParamsSchema = z.object({
  days: z.number().int().min(1).max(365).optional(),
  topPostsLimit: z.number().int().min(1).max(25).optional(),
});
export type IrisAnalyticsReadTaskParams = z.infer<
  typeof irisAnalyticsReadTaskParamsSchema
>;

export const IRIS_EXPERIMENT_NAME_MAX_LENGTH = 120;
export const IRIS_EXPERIMENT_HYPOTHESIS_MAX_LENGTH = 500;

export const irisExperimentMetricSchema = z.enum([
  "engagement",
  "impressions",
  "likes",
]);
export type IrisExperimentMetric = z.infer<typeof irisExperimentMetricSchema>;

export const irisExperimentCreateTaskParamsSchema = z.object({
  name: z.string().min(1).max(IRIS_EXPERIMENT_NAME_MAX_LENGTH),
  hypothesis: z.string().max(IRIS_EXPERIMENT_HYPOTHESIS_MAX_LENGTH).optional(),
  variantAPostId: z.string().min(1),
  variantBPostId: z.string().min(1),
  metric: irisExperimentMetricSchema.default(IRIS_EXPERIMENT_DEFAULT_METRIC),
  provider: irisSocialPlatformSchema.default(IRIS_EXPERIMENT_DEFAULT_PROVIDER),
});
export type IrisExperimentCreateTaskParams = z.infer<
  typeof irisExperimentCreateTaskParamsSchema
>;

export const irisExperimentReadTaskParamsSchema = z.object({
  limit: z.number().int().min(1).max(25).optional(),
});
export type IrisExperimentReadTaskParams = z.infer<
  typeof irisExperimentReadTaskParamsSchema
>;

export const irisTaskParamSchemas: Record<string, z.ZodType> = {
  [IRIS_CAPABILITY_SOURCE_GITHUB_READ]: irisSourceReadTaskParamsSchema,
  [IRIS_CAPABILITY_ANALYTICS_READ]: irisAnalyticsReadTaskParamsSchema,
  [IRIS_CAPABILITY_EXPERIMENT_CREATE]: irisExperimentCreateTaskParamsSchema,
  [IRIS_CAPABILITY_EXPERIMENT_READ]: irisExperimentReadTaskParamsSchema,
  [IRIS_CAPABILITY_CHANGELOG_CREATE]: irisContentTaskParamsSchema,
  [IRIS_CAPABILITY_BLOG_POST_CREATE]: irisBlogPostTaskParamsSchema,
  [IRIS_CAPABILITY_SOCIAL_POST_CREATE]: irisSocialPostTaskParamsSchema,
};

export const irisImageReviewSchema = z
  .object({
    accept: z.boolean(),
    reason: z.string().min(1),
    revisionPrompt: z.string().max(400).nullable(),
  })
  .superRefine((review, ctx) => {
    if (!review.accept && (review.revisionPrompt ?? "").trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["revisionPrompt"],
        message: "A rejection needs a concrete revision instruction",
      });
    }
    if (review.accept && review.revisionPrompt !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["revisionPrompt"],
        message: "An accepted image must not carry a revision instruction",
      });
    }
  });
export type IrisImageReview = z.infer<typeof irisImageReviewSchema>;

export const irisSignalEnvelopeSchema = z.looseObject({
  id: z.string().optional(),
  source: z.string().optional(),
  kind: z.string().optional(),
  sourceEventId: z.string().nullable().optional(),
  occurredAt: z.union([z.string(), z.date()]).optional(),
  payload: z.unknown().optional(),
});
export type IrisSignalEnvelope = z.infer<typeof irisSignalEnvelopeSchema>;

export const irisSignalRepositoryRefSchema = z.looseObject({
  repositoryId: z.string().optional(),
  repositoryName: z.string().optional(),
});
