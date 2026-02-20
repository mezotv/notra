// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const getPostsParamsSchema = z.object({
  organizationId: z.string().trim().min(1, "organizationId is required"),
});

export const getPostsQuerySchema = z.object({
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export const getPostParamsSchema = z.object({
  organizationId: z.string().trim().min(1, "organizationId is required"),
  postId: z.string().trim().min(1, "postId is required"),
});
