// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  OAUTH_AUTHORIZATION_CODE_GRANT,
  OAUTH_CODE_CHALLENGE_METHOD,
  OAUTH_REFRESH_TOKEN_GRANT,
  OAUTH_SUPPORTED_RESOURCE_SET,
  OAUTH_SUPPORTED_SCOPE_SET,
} from "@/constants/oauth";

const WHITESPACE_REGEX = /\s+/;

const scopeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || "api.read")
  .refine(
    (value) =>
      value
        .split(WHITESPACE_REGEX)
        .filter(Boolean)
        .every((scope) => OAUTH_SUPPORTED_SCOPE_SET.has(scope)),
    "Unsupported OAuth scope"
  );

export const oauthAuthorizeSearchParamsSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().trim().min(1).max(500),
  redirect_uri: z.string().trim().url(),
  scope: scopeSchema,
  state: z.string().trim().max(2048).optional(),
  code_challenge: z.string().trim().min(43).max(128),
  code_challenge_method: z.literal(OAUTH_CODE_CHALLENGE_METHOD),
  resource: z
    .string()
    .trim()
    .url()
    .optional()
    .transform((value) => value || "https://mcp.usenotra.com")
    .refine(
      (value) => OAUTH_SUPPORTED_RESOURCE_SET.has(value),
      "Unsupported OAuth resource"
    ),
});

export const oauthConsentFormSchema = oauthAuthorizeSearchParamsSchema.extend({
  organization_id: z.string().trim().min(1),
  decision: z.enum(["approve", "deny"]),
});

export const oauthAuthorizationCodeTokenSchema = z.object({
  grant_type: z.literal(OAUTH_AUTHORIZATION_CODE_GRANT),
  code: z.string().trim().min(32),
  redirect_uri: z.string().trim().url(),
  client_id: z.string().trim().min(1).max(500),
  code_verifier: z.string().trim().min(43).max(128),
});

export const oauthRefreshTokenSchema = z.object({
  grant_type: z.literal(OAUTH_REFRESH_TOKEN_GRANT),
  refresh_token: z.string().trim().min(32),
  client_id: z.string().trim().min(1).max(500).optional(),
});

export const oauthTokenRequestSchema = z.discriminatedUnion("grant_type", [
  oauthAuthorizationCodeTokenSchema,
  oauthRefreshTokenSchema,
]);

export const oauthRevokeTokenSchema = z.object({
  token: z.string().trim().min(1),
  token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
});

export const oauthAuthorizationCodePayloadSchema = z.object({
  clientId: z.string().min(1),
  redirectUri: z.string().url(),
  scope: scopeSchema,
  codeChallenge: z.string().min(43).max(128),
  resource: z
    .string()
    .url()
    .refine((value) => OAUTH_SUPPORTED_RESOURCE_SET.has(value)),
  userId: z.string().min(1),
  organizationId: z.string().min(1),
});

export const oauthRefreshTokenPayloadSchema = z.object({
  clientId: z.string().min(1),
  scope: scopeSchema,
  resource: z
    .string()
    .url()
    .refine((value) => OAUTH_SUPPORTED_RESOURCE_SET.has(value)),
  userId: z.string().min(1),
  organizationId: z.string().min(1),
});
