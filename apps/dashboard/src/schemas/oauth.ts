// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  OAUTH_SUPPORTED_RESOURCES,
  OAUTH_SUPPORTED_SCOPES,
} from "@/constants/oauth";

const SCOPE_SEPARATOR_REGEX = /\s+/;

const scopeSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.split(SCOPE_SEPARATOR_REGEX))
  .pipe(z.array(z.enum(OAUTH_SUPPORTED_SCOPES)).min(1))
  .transform((value) => value.join(" "));

const consentScopeSchema = z
  .string()
  .trim()
  .transform((value) =>
    value ? value.split(SCOPE_SEPARATOR_REGEX) : ([] as string[])
  )
  .pipe(z.array(z.enum(OAUTH_SUPPORTED_SCOPES)))
  .transform((value) => value.join(" "));

const resourceSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => OAUTH_SUPPORTED_RESOURCES.some((resource) => resource === value),
    "Unsupported OAuth resource"
  );

export const oauthSignedAuthorizeQuerySchema = z.object({
  client_id: z.string().trim().min(1).max(500),
  code_challenge: z.string().trim().min(43).max(128),
  code_challenge_method: z.literal("S256"),
  exp: z.coerce.number().int().positive(),
  redirect_uri: z.string().trim().url(),
  resource: resourceSchema.optional(),
  response_type: z.literal("code"),
  scope: scopeSchema.optional(),
  sig: z.string().trim().min(1),
  state: z.string().trim().max(2048).optional(),
});

export const oauthConsentFormSchema = z.object({
  oauth_query: z
    .string()
    .trim()
    .min(1)
    .refine((value) => {
      const parsed = oauthSignedAuthorizeQuerySchema.safeParse(
        Object.fromEntries(new URLSearchParams(value).entries())
      );

      return parsed.success;
    }, "Invalid OAuth authorization query"),
  decision: z.enum(["approve", "deny"]),
  organization_id: z.string().trim().min(1).optional(),
  scope: consentScopeSchema.optional(),
});

export const oauthConsentResponseSchema = z
  .union([
    z.object({
      redirect_uri: z.string().url(),
    }),
    z.object({
      redirect: z.literal(true),
      url: z.string().url(),
    }),
  ])
  .transform((value) => ({
    redirect_uri: "redirect_uri" in value ? value.redirect_uri : value.url,
  }));
