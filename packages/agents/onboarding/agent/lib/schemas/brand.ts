import { z } from "zod";

export const brandResponseSchema = z.looseObject({
  status: z.string().optional(),
  brand: z.record(z.string(), z.unknown()).default({}),
});
