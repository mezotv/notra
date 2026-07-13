import { z } from "zod";

export const onboardingProfileSchema = z.object({
  companyName: z.string().min(1),
  website: z.string().nullable(),
  socialHandles: z.object({
    twitter: z.string().nullable(),
    linkedin: z.string().nullable(),
  }),
  productSummary: z.string().min(1),
  audience: z.string().min(1),
  tone: z.string().min(1),
  contentPillars: z.array(z.string()).min(1),
  competitors: z.array(z.string()),
  memoriesSaved: z.array(z.string()),
  skillEditsApplied: z.array(z.string()),
  brandUpdatesApplied: z.array(z.string()),
  referencesAdded: z.array(z.string()),
  suggestionsCreated: z.array(z.string()),
  sources: z.array(z.string()),
});
