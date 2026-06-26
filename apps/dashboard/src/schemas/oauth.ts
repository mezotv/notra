// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const oauthConsentFormSchema = z.object({
  oauth_query: z.string().trim().min(1),
  decision: z.enum(["approve", "deny"]),
});

export const oauthConsentResponseSchema = z.object({
  redirect_uri: z.string().url(),
});
