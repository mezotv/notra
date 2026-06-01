// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const repoImageModeSchema = z.enum(["prompt", "pr", "commit"]);
export const REPO_IMAGE_MODES = repoImageModeSchema.options;

const repoImageRequestFields = {
  integrationId: z.string().min(1, "Integration ID is required"),
  branch: z.string().trim().min(1, "Branch is required"),
  mode: repoImageModeSchema,
  prompt: z.string().trim().max(500).optional(),
  prNumber: z.number().int().positive().optional(),
  commitSha: z
    .string()
    .trim()
    .regex(/^[0-9a-f]{7,40}$/i, "Must be a git SHA (7-40 hex chars)")
    .optional(),
};

function validateRepoImageModeInput(
  value: {
    mode: z.infer<typeof repoImageModeSchema>;
    prompt?: string;
    prNumber?: number;
    commitSha?: string;
  },
  ctx: z.RefinementCtx
) {
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
}

export const generateRepoImageInputSchema = z
  .object({
    organizationId: z.string().min(1, "Organization ID is required"),
    ...repoImageRequestFields,
  })
  .superRefine(validateRepoImageModeInput);

export const imageToolInputSchema = z
  .object(repoImageRequestFields)
  .extend({
    title: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .describe("A concise title for the saved image content"),
    sourcePostId: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe(
        "Optional existing image post ID to continue from its saved sandbox snapshot"
      ),
  })
  .superRefine(validateRepoImageModeInput);

export const imageRevisionToolInputSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .describe("The visual changes to apply to the current image"),
  title: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional()
    .describe("Optional updated title for the image content"),
});

export const unavailableImageRevisionToolInputSchema = z.object({
  prompt: z.string().optional(),
});
