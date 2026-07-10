import { z } from "zod";

export const mcpOAuthSecretStringSchema = z.string().min(1);

export const mcpOAuthTokensSchema = z
  .object({
    access_token: z.string().min(1),
    authorization_server: z.string().url().optional(),
    expires_in: z.number().nonnegative().optional(),
    id_token: z.string().optional(),
    refresh_token: z.string().min(1).optional(),
    scope: z.string().optional(),
    token_endpoint: z.string().url().optional(),
    token_type: z.string().min(1),
  })
  .passthrough();

export const mcpOAuthClientInformationSchema = z
  .object({
    authorization_server: z.string().url().optional(),
    client_id: z.string().min(1),
    client_id_issued_at: z.number().optional(),
    client_secret: z.string().optional(),
    client_secret_expires_at: z.number().optional(),
    redirect_uris: z.array(z.string().url()).optional(),
    token_endpoint: z.string().url().optional(),
  })
  .passthrough();

export const mcpOAuthAuthorizationServerInformationSchema = z.object({
  authorizationServerUrl: z.string().url(),
  tokenEndpoint: z.string().url(),
});

export const mcpOAuthErrorResponseSchema = z.object({
  error: z.string().min(1),
  error_description: z.string().optional(),
});
