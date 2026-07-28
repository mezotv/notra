import { z } from "zod";

export const generationConfigSchema = z.object({
  selectionFilters: z
    .object({
      allowedPullRequestNumbersByIntegrationId: z
        .record(z.string(), z.array(z.number()))
        .optional(),
      allowedReleaseTagsByIntegrationId: z
        .record(z.string(), z.array(z.string()))
        .optional(),
      allowedReleaseTagsGlobal: z.array(z.string()).optional(),
      allowedCommitShas: z.array(z.string()).optional(),
    })
    .optional(),
  commitWindow: z
    .object({
      since: z.string().optional(),
      until: z.string().optional(),
    })
    .optional(),
  dataPointSettings: z
    .object({
      includePullRequests: z.boolean().optional(),
      includeReleases: z.boolean().optional(),
      includeCommits: z.boolean().optional(),
      includeLinearData: z.boolean().optional(),
    })
    .optional(),
});
