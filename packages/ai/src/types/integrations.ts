export interface ErrorWithStatus {
  status?: number;
}

export type GitHubIntegrationAuthType = "github_app" | "legacy";

export interface GitHubAppRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string | null;
  owner: {
    login: string;
  };
}

export interface CreateGitHubAppIntegrationsForInstallationParams {
  organizationId: string;
  userId: string;
  installationId: string;
}

export interface GitHubAppInstallationRecord {
  id: string;
  installationId: string;
  accountLogin: string | null;
  accountType: string | null;
}

export interface ValidateRepositoryBranchExistsParams {
  owner: string;
  repo: string;
  branch: string;
  token?: string | null;
  encryptedToken?: string | null;
  authType?: string | null;
  githubAppInstallationId?: string | null;
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
