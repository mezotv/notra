// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const getPostsParamsSchema = z.object({
  organizationId: z.string().trim().min(1, "organizationId is required"),
});

export const getPostsQuerySchema = z.object({
  sort: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
});

export const getPostParamsSchema = z.object({
  organizationId: z.string().trim().min(1, "organizationId is required"),
  postId: z.string().trim().min(1, "postId is required"),
});
