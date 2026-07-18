import type {
  AvailableGitHubIntegration,
  AvailableGitHubIntegrationRecord,
  AvailableGranolaIntegrationRecord,
  AvailableLinearIntegrationRecord,
  BrandIdentityRecord,
  BrandIdentitySummary,
} from "@notra/ai/types/organization";

export function serializeBrandIdentity(
  identity: BrandIdentityRecord
): BrandIdentitySummary {
  return {
    id: identity.id,
    name: identity.name,
    isDefault: identity.isDefault,
    websiteUrl: identity.websiteUrl,
    companyName: identity.companyName,
    companyDescription: identity.companyDescription,
    toneProfile: identity.toneProfile,
    customTone: identity.customTone,
    customInstructions: identity.customInstructions,
    audience: identity.audience,
    language: identity.language,
    createdAt: identity.createdAt.toISOString(),
    updatedAt: identity.updatedAt.toISOString(),
  };
}

export function isAvailableGitHubIntegration(
  integration: AvailableGitHubIntegrationRecord
): boolean {
  return integration.enabled && integration.repositoryEnabled;
}

export function isAvailableLinearIntegration(
  integration: AvailableLinearIntegrationRecord
): integration is AvailableLinearIntegrationRecord {
  return integration.enabled;
}

export function serializeAvailableGitHubIntegration(
  integration: AvailableGitHubIntegration
) {
  return {
    id: integration.id,
    type: "github" as const,
    displayName: integration.displayName,
    repositories: [
      {
        id: integration.id,
        owner: integration.owner,
        repo: integration.repo,
        defaultBranch: integration.defaultBranch,
        enabled: true,
      },
    ],
  };
}

export function toAvailableGitHubIntegration(
  integration: AvailableGitHubIntegrationRecord
): AvailableGitHubIntegration | null {
  if (
    !isAvailableGitHubIntegration(integration) ||
    typeof integration.owner !== "string" ||
    typeof integration.repo !== "string"
  ) {
    return null;
  }

  return {
    ...integration,
    owner: integration.owner,
    repo: integration.repo,
  };
}

export function serializeAvailableLinearIntegration(
  integration: AvailableLinearIntegrationRecord
) {
  return {
    id: integration.id,
    type: "linear" as const,
    displayName: integration.displayName,
    linearTeamId: integration.linearTeamId,
    linearTeamName: integration.linearTeamName,
    linearOrganizationId: integration.linearOrganizationId,
    linearOrganizationName: integration.linearOrganizationName,
  };
}

export function isAvailableGranolaIntegration(
  integration: AvailableGranolaIntegrationRecord
): integration is AvailableGranolaIntegrationRecord {
  return integration.enabled;
}

export function serializeAvailableGranolaIntegration(
  integration: AvailableGranolaIntegrationRecord
) {
  return {
    id: integration.id,
    type: "granola" as const,
    displayName: integration.displayName,
    workspaceName: integration.workspaceName,
  };
}
