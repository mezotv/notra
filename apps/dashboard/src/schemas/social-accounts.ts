// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

export const socialConnectPlatformSchema = z.enum(["twitter", "linkedin"]);

export type SocialConnectPlatform = z.infer<typeof socialConnectPlatformSchema>;

export const socialConnectOAuthStateSchema = z.object({
  organizationId: z.string().min(1),
  callbackPath: z.string(),
  platform: socialConnectPlatformSchema,
  profileId: z.string().min(1),
});

export type SocialConnectOAuthState = z.infer<
  typeof socialConnectOAuthStateSchema
>;

export const socialConnectCallbackQuerySchema = z.object({
  state: z.string().min(1),
  accountId: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  error: z.string().optional(),
});
