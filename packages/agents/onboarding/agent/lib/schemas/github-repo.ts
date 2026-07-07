// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const githubRepoSchema = z.object({
  full_name: z.string(),
  description: z.string().nullable(),
  homepage: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  language: z.string().nullable(),
  stargazers_count: z.number(),
});
