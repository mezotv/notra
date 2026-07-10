import type { MCPClient } from "@ai-sdk/mcp";
import type {
  AuthorizationServerMetadata,
  OAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { z } from "zod";
import type {
  MCP_AUTH_TYPES,
  MCP_OAUTH_CREDENTIAL_STATUSES,
} from "../constants/mcp-auth";
import type { mcpOAuthStoredAuthorizationServerSchema } from "../schemas/mcp-oauth";
import type { McpHeaderMap } from "./integrations";

export type McpAuthType = (typeof MCP_AUTH_TYPES)[number];

export type McpOAuthCredentialStatus =
  (typeof MCP_OAUTH_CREDENTIAL_STATUSES)[number];

export interface McpRequestAuth {
  authType: McpAuthType;
  headers: McpHeaderMap;
  oauthTokenVersion?: number;
}

export interface McpClientEntry {
  client: MCPClient;
  requestAuth: McpRequestAuth;
}

export interface BeginMcpOAuthAuthorizationParams {
  callbackPath: string;
  description?: string | null;
  name: string;
  organizationId: string;
  redirectUrl: string;
  serverIntegrationId?: string;
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
