// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const brandSocialsResponseSchema = z.looseObject({
  brand: z.looseObject({
    domain: z.string().optional(),
    socials: z
      .array(
        z.looseObject({
          type: z.string(),
          url: z.string(),
        })
      )
      .default([]),
  }),
});
