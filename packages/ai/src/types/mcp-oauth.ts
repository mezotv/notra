import type {
  MCPClient,
  OAuthAuthorizationServerInformation,
  OAuthClientInformation,
  OAuthTokens,
} from "@ai-sdk/mcp";
import type {
  MCP_AUTH_TYPES,
  MCP_OAUTH_CREDENTIAL_STATUSES,
} from "../constants/mcp-auth";
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

export interface McpOAuthProviderState {
  authorizationServerInformation?: OAuthAuthorizationServerInformation;
  clientInformation?: OAuthClientInformation;
  codeVerifier?: string;
  state?: string;
  tokens?: OAuthTokens;
}

export interface McpOAuthProviderPersistence {
  saveAuthorizationServerInformation?: (
    information: OAuthAuthorizationServerInformation
  ) => Promise<void>;
  saveClientInformation?: (
    information: OAuthClientInformation
  ) => Promise<void>;
  saveCodeVerifier?: (codeVerifier: string) => Promise<void>;
  saveTokens?: (tokens: OAuthTokens) => Promise<void>;
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

export interface McpOAuthPendingSecrets {
  encryptedAuthorizationServerInformation: string | null;
  encryptedClientInformation: string | null;
}

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
