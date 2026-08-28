// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

import { loginSchema, verificationCodeSchema } from "@/schemas/auth";

const RETURN_TO_MAX_LENGTH = 2048;
const AUTH_TOKEN_MAX_LENGTH = 4096;
const USER_SEARCH_MAX_LENGTH = 100;

const returnToSchema = z.string().max(RETURN_TO_MAX_LENGTH).nullish();

export const signInWithPasswordInputSchema = loginSchema.extend({
  returnTo: returnToSchema,
});

export const verifyEmailCodeInputSchema = z.object({
  pendingAuthenticationToken: z
    .string()
    .min(1, "Verification session is missing")
    .max(AUTH_TOKEN_MAX_LENGTH),
  code: verificationCodeSchema,
  returnTo: returnToSchema,
});

const socialAuthProviderSchema = z.enum(["google", "github"]);

export const startSocialSignInInputSchema = z.object({
  provider: socialAuthProviderSchema,
  returnTo: returnToSchema,
});

export const signOutOptionsSchema = z
  .object({
    returnTo: z.string().min(1).max(RETURN_TO_MAX_LENGTH).optional(),
  })
  .optional();

export const listUsersInputSchema = z
  .object({
    search: z.string().trim().max(USER_SEARCH_MAX_LENGTH).optional(),
  })
  .optional();
