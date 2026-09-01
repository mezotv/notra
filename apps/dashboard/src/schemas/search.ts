import "zod/compile";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

export const globalSearchInputSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  query: z.string().trim().min(1).max(200),
  limit: z.number().int().min(1).max(20).default(5),
});
