// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const repoImageModeSchema = z.enum(["prompt", "pr", "commit"]);
export const REPO_IMAGE_MODES = repoImageModeSchema.options;

export const generateRepoImageInputSchema = z
  .object({
    organizationId: z.string().min(1, "Organization ID is required"),
    integrationId: z.string().min(1, "Integration ID is required"),
    branch: z.string().trim().min(1, "Branch is required"),
    mode: repoImageModeSchema,
    prompt: z.string().trim().max(500).optional(),
    prNumber: z.number().int().positive().optional(),
    commitSha: z
      .string()
      .trim()
      .regex(/^[0-9a-f]{7,40}$/i, "Must be a git SHA (7–40 hex chars)")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "prompt" && !value.prompt) {
      ctx.addIssue({
        code: "custom",
        path: ["prompt"],
        message: "Prompt is required",
      });
    }
    if (value.mode === "pr" && value.prNumber === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["prNumber"],
        message: "PR number is required",
      });
    }
    if (value.mode === "commit" && !value.commitSha) {
      ctx.addIssue({
        code: "custom",
        path: ["commitSha"],
        message: "Commit SHA is required",
      });
    }
  });
