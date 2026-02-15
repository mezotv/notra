// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

const slugPattern = /^[a-z0-9-]+$/;

export const changelogCompanyParamsSchema = z.object({
  name: z.string().trim().min(1).max(80).regex(slugPattern),
});

export const changelogEntryParamsSchema = changelogCompanyParamsSchema.extend({
  slug: z.string().trim().min(1).max(180).regex(slugPattern),
});
