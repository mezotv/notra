// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

const REPO_SLUG = /^[\w.-]+$/;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const MAX_AVATARS = 60;

function isAllowedAvatarUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "githubusercontent.com" ||
        url.hostname.endsWith(".githubusercontent.com"))
    );
  } catch {
    return false;
  }
}

const avatarUrl = z
  .url()
  .refine(isAllowedAvatarUrl, "Avatar URLs must be on githubusercontent.com.");

const ownerSlug = z
  .string()
  .trim()
  .min(1, "Owner is required.")
  .max(100)
  .regex(REPO_SLUG, "Enter a valid GitHub owner.");

const repoSlug = z
  .string()
  .trim()
  .min(1, "Repository is required.")
  .max(100)
  .regex(REPO_SLUG, "Enter a valid GitHub repository.");

export const starVideoInputSchema = z.object({
  owner: ownerSlug,
  repo: repoSlug,
  stars: z.number().int().min(0),
  avatars: z.array(avatarUrl).max(MAX_AVATARS),
  backgroundColor: z.string().regex(HEX_COLOR).default("#b9f0cd"),
});

export const repoQuerySchema = z.object({
  owner: ownerSlug,
  repo: repoSlug,
});
