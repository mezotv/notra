export interface ErrorWithStatus {
  status?: number;
}

export interface ValidateRepositoryBranchExistsParams {
  owner: string;
  repo: string;
  branch: string;
  token?: string | null;
  encryptedToken?: string | null;
}

export interface CreateGitHubIntegrationParams {
  organizationId: string;
  userId: string;
  token: string | null;
  displayName: string;
  owner: string;
  repo: string;
  defaultBranch: string | null;
}

export interface AddRepositoryParams {
  integrationId: string;
  owner: string;
  repo: string;
  outputs?: Array<{
    type: string;
    enabled?: boolean;
    config?: Record<string, unknown>;
  }>;
}

export interface ConfigureOutputParams {
  repositoryId: string;
  outputType: string;
  enabled: boolean;
  config?: Record<string, unknown> | null;
}

export interface WebhookConfig {
  webhookUrl: string;
  webhookSecret: string;
  repositoryId: string;
  owner: string;
  repo: string;
}

export interface CreateLinearIntegrationParams {
  organizationId: string;
  userId: string;
  displayName: string;
  accessToken: string;
  linearOrganizationId: string;
  linearOrganizationName?: string;
  linearTeamId?: string;
  linearTeamName?: string;
}

export interface McpHeaderMap {
  [key: string]: string;
}

export type McpServerAuthType = "headers" | "oauth";

export interface CreateMcpServerIntegrationParams {
  organizationId: string;
  userId: string;
  name: string;
  url: string;
  description?: string | null;
  headers?: McpHeaderMap;
  authType?: McpServerAuthType;
}

export interface McpOauthAuthorizationContext {
  authorizationServerUrl: string;
  clientId: string;
  clientSecret?: string;
  scope?: string;
  resource?: string;
  codeVerifier: string;
}

export interface StartMcpOauthAuthorizationParams {
  serverUrl: string;
  redirectUrl: string;
  state: string;
}

export interface StartMcpOauthAuthorizationResult {
  authorizationUrl: string;
  context: McpOauthAuthorizationContext;
}

export interface CompleteMcpOauthAuthorizationParams {
  integrationId: string;
  organizationId: string;
  authorizationCode: string;
  redirectUri: string;
  context: McpOauthAuthorizationContext;
}

export interface McpIntegrationAuthState {
  id: string;
  authType: string;
  encryptedHeaders: McpHeaderMap | null;
  oauthAuthorizationServerUrl: string | null;
  oauthResource: string | null;
  oauthClientId: string | null;
  encryptedOauthClientSecret: string | null;
  encryptedOauthAccessToken: string | null;
  encryptedOauthRefreshToken: string | null;
  oauthTokenExpiresAt: Date | null;
}

export interface UpdateMcpServerIntegrationParams {
  name?: string;
  url?: string;
  description?: string | null;
  headers?: McpHeaderMap;
  enabled?: boolean;
}
