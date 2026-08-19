import { z } from "zod";

export const companyLogoInputSchema = z.object({
  domain: z.string().trim().min(1).max(255),
});
