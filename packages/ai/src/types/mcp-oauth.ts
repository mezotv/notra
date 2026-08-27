import type {
  AuthorizationServerMetadata,
  OAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { z } from "zod";

import type { MCP_AUTH_TYPES } from "../constants/mcp-auth";
import type { mcpOAuthStoredAuthorizationServerSchema } from "../schemas/mcp-oauth";
import type { McpHeaderMap, McpIntegrationResourceType } from "./integrations";

export type McpAuthType = (typeof MCP_AUTH_TYPES)[number];

export type McpRequestAuth =
  | { authType: "none"; headers: McpHeaderMap }
  | { authType: "headers"; headers: McpHeaderMap }
  | {
      authType: "oauth";
      headers: McpHeaderMap;
      oauthTokenVersion: number;
    };

export interface BeginMcpOAuthAuthorizationParams {
  callbackPath: string;
  description?: string | null;
  name: string;
  organizationId: string;
  redirectUrl: string;
  resourceType: McpIntegrationResourceType;
  serverIntegrationId?: string;
  storeSourceIntegrationId?: string;
  url: string;
  userId: string;
}

export interface CompleteMcpOAuthAuthorizationParams {
  callbackState: string;
  code: string;
  redirectUrl: string;
  userId: string;
}

export interface McpOAuthServerConfiguration {
  authorizationServerMetadata: AuthorizationServerMetadata;
  authorizationServerUrl: URL;
  resource?: URL;
  resourceMetadata?: OAuthProtectedResourceMetadata;
}

export type McpOAuthStoredAuthorizationServer = z.infer<
  typeof mcpOAuthStoredAuthorizationServerSchema
>;

export interface McpOAuthRetryParams<T> {
  integrationId: string;
  operation: (requestAuth: McpRequestAuth, isRetry: boolean) => Promise<T>;
  organizationId: string;
  requestAuth: McpRequestAuth;
}

export interface RefreshMcpOAuthRequestAuthParams {
  expectedTokenVersion?: number;
  integrationId: string;
  organizationId: string;
}
