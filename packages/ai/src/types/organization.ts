export interface OrganizationToolConfig {
  organizationId: string;
}

export interface BrandIdentityRecord {
  id: string;
  name: string;
  isDefault: boolean;
  websiteUrl: string | null;
  companyName: string | null;
  companyDescription: string | null;
  toneProfile: string | null;
  customTone: string | null;
  customInstructions: string | null;
  audience: string | null;
  language: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandIdentitySummary {
  id: string;
  name: string;
  isDefault: boolean;
  websiteUrl: string | null;
  companyName: string | null;
  companyDescription: string | null;
  toneProfile: string | null;
  customTone: string | null;
  customInstructions: string | null;
  audience: string | null;
  language: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableGitHubIntegrationRecord {
  id: string;
  displayName: string;
  enabled: boolean;
  owner: string | null;
  repo: string | null;
  defaultBranch: string | null;
  repositoryEnabled: boolean;
}

export interface AvailableGitHubIntegration extends AvailableGitHubIntegrationRecord {
  owner: string;
  repo: string;
}

export interface AvailableLinearIntegrationRecord {
  id: string;
  displayName: string;
  enabled: boolean;
  linearTeamId: string | null;
  linearTeamName: string | null;
  linearOrganizationId: string;
  linearOrganizationName: string | null;
}

export interface AvailableGranolaIntegrationRecord {
  id: string;
  displayName: string;
  enabled: boolean;
  workspaceName: string | null;
}
