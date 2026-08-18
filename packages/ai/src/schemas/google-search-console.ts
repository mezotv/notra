import { z } from "zod";

export const gscTokenResponseSchema = z.looseObject({
  access_token: z.string().min(1),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  id_token: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const gscUserInfoSchema = z.looseObject({
  email: z.string().optional(),
});

export const gscSitesResponseSchema = z.looseObject({
  siteEntry: z
    .array(
      z.looseObject({
        siteUrl: z.string().min(1),
        permissionLevel: z.string().optional(),
      })
    )
    .optional(),
});

export const gscSearchAnalyticsResponseSchema = z.looseObject({
  rows: z
    .array(
      z.looseObject({
        keys: z.array(z.string()),
        clicks: z.number(),
        impressions: z.number(),
        ctr: z.number(),
        position: z.number(),
      })
    )
    .optional(),
});
