// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { organizationIdSchema } from "@/schemas/auth/organization";

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

export const publishSocialPostBodySchema = z.object({
  accountId: z.string().min(1),
  content: z.string().trim().min(1, "Post content is required"),
});

export const socialAccountsOrganizationInputSchema = z.object({
  organizationId: organizationIdSchema,
});

export const refreshSocialAccountsInputSchema = z.object({
  organizationId: organizationIdSchema,
  accountId: z.string().min(1).optional(),
});

export const disconnectSocialAccountInputSchema =
  socialAccountsOrganizationInputSchema.extend({
    accountId: z.string().min(1),
  });

export const beginConnectInputSchema =
  socialAccountsOrganizationInputSchema.extend({
    platform: socialConnectPlatformSchema,
    callbackPath: z.string().default("/"),
  });

export const publishSocialPostInputSchema =
  socialAccountsOrganizationInputSchema.extend(
    publishSocialPostBodySchema.shape
  );

export const socialConnectCallbackQuerySchema = z.object({
  state: z.string().min(1),
  accountId: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  pendingDataToken: z.string().min(1).optional(),
  error: z.string().optional(),
});

export const linkedinSelectionGetInputSchema = z.object({
  state: z.string().min(1),
  token: z.string().min(1),
});

export const linkedinSelectionCompleteInputSchema = z.object({
  state: z.string().min(1),
  accountType: z.enum(["personal", "organization"]),
  organizationId: z.string().min(1).optional(),
});
