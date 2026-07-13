import { z } from "zod";

export const brandSocialsResponseSchema = z.looseObject({
  brand: z.looseObject({
    domain: z.string().optional(),
    socials: z
      .array(
        z.looseObject({
          type: z.string(),
          url: z.url(),
        })
      )
      .default([]),
  }),
});
