// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

const REPO_SLUG = /^[\w.-]+$/;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const starVideoInputSchema = z.object({
  owner: z.string().trim().min(1).max(100),
  repo: z.string().trim().min(1).max(100),
  stars: z.number().int().min(0),
  avatars: z.array(z.string().url()),
  backgroundColor: z.string().regex(HEX_COLOR).default("#b9f0cd"),
});

export const repoQuerySchema = z.object({
  owner: z
    .string()
    .trim()
    .min(1, "Owner is required.")
    .max(100)
    .regex(REPO_SLUG, "Enter a valid GitHub owner."),
  repo: z
    .string()
    .trim()
    .min(1, "Repository is required.")
    .max(100)
    .regex(REPO_SLUG, "Enter a valid GitHub repository."),
});
