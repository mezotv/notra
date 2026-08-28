// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

const ASK_QUERY_MAX_LENGTH = 2000;

export const askRequestSchema = z.object({
  query: z.string().max(ASK_QUERY_MAX_LENGTH).optional(),
  prefer: z
    .object({
      streaming: z.boolean().optional(),
    })
    .optional(),
});
