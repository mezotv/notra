import {
  OAuthClientInformationFullSchema,
  OAuthClientInformationSchema,
  OAuthMetadataSchema,
  OpenIdProviderDiscoveryMetadataSchema,
} from "@modelcontextprotocol/sdk/shared/auth.js";
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

export const mcpOAuthClientInformationSchema = z.union([
  OAuthClientInformationFullSchema,
  OAuthClientInformationSchema,
]);

const mcpOAuthAuthorizationServerMetadataSchema = z.union([
  OAuthMetadataSchema,
  OpenIdProviderDiscoveryMetadataSchema,
]);

export const mcpOAuthStoredAuthorizationServerSchema = z.union([
  mcpOAuthAuthorizationServerMetadataSchema,
  z.object({
    authorizationServerUrl: z.string().url(),
    tokenEndpoint: z.string().url(),
  }),
]);
