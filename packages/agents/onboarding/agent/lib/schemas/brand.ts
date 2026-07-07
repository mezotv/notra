// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const brandResponseSchema = z.looseObject({
  status: z.string().optional(),
  brand: z.record(z.string(), z.unknown()).default({}),
});
