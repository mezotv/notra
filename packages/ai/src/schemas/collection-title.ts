// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const COLLECTION_TITLE_MAX_LENGTH = 70;

export const collectionTitleResultSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3)
    .max(COLLECTION_TITLE_MAX_LENGTH)
    .describe(
      "A short, specific display title summarizing what this batch of content covers. Plain text, no dates, no surrounding quotes."
    ),
});
