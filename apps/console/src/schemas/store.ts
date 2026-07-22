// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const storeIntegrationIdParamSchema = z.object({
  id: z.string().trim().min(1, "Integration ID is required").max(120),
});
