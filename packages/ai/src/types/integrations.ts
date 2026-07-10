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

export interface McpServerIntegrationSerializationInput {
  id: string;
  name: string;
  url: string;
  description: string | null;
  authType: string;
  encryptedHeaders: McpHeaderMap;
  enabled: boolean;
  lastToolSyncAt?: Date | null;
  toolSyncStatus?: string;
  toolSyncError?: string | null;
  indexedToolCount?: number;
  oauthCredential?: {
    status: string;
  } | null;
  createdAt: Date;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
}

export interface CreateMcpServerIntegrationParams {
  authType: "none" | "headers";
  organizationId: string;
  userId: string;
  name: string;
  url: string;
  description?: string | null;
  headers?: McpHeaderMap;
}

export interface UpdateMcpServerIntegrationParams {
  authType?: "none" | "headers";
  name?: string;
  url?: string;
  description?: string | null;
  headers?: McpHeaderMap;
  enabled?: boolean;
}
