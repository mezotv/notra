// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const supermemorySearchResponseSchema = z.object({
  results: z
    .array(
      z.looseObject({
        documentId: z.string().optional(),
        chunks: z
          .array(z.looseObject({ content: z.string().optional() }))
          .optional(),
        memory: z.string().optional(),
        title: z.string().nullable().optional(),
        score: z.number().optional(),
        metadata: z.record(z.string(), z.unknown()).nullable().optional(),
      })
    )
    .default([]),
});

export const supermemoryCreateResponseSchema = z.looseObject({
  documentId: z.string().nullable().optional(),
  memories: z.array(z.looseObject({ id: z.string().optional() })).optional(),
});
