import { z } from "zod";

export const brandReferenceMetadataSchema = z.looseObject({
  tweetId: z.string().optional(),
});

export const supermemoryDocumentResponseSchema = z.looseObject({
  id: z.string(),
});
