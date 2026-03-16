// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const contentTypeSchema = z.enum([
  "changelog",
  "blog_post",
  "twitter_post",
  "linkedin_post",
  "investor_update",
]);

export type ContentType = z.infer<typeof contentTypeSchema>;
