import { z } from "zod";

export const githubReleaseListSchema = z.array(
  z.object({
    tag_name: z.string(),
    name: z.string().nullable(),
    published_at: z.string().nullable(),
    draft: z.boolean(),
    prerelease: z.boolean(),
  })
);

export const githubCommitListSchema = z.array(
  z.object({
    sha: z.string(),
    commit: z.object({
      message: z.string(),
      author: z
        .object({
          name: z.string().nullable().optional(),
          date: z.string().optional(),
        })
        .nullable(),
    }),
  })
);
