import { db } from "@notra/db/drizzle";
import { githubIntegrations } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";

import {
  createGitHubAppInstallationTokenForRecord,
  getTokenForIntegrationId,
  isGitHubAppConfigured,
  listGitHubAppInstallationsByOrganization,
} from "./github";

export class GitHubAppRequiredForPublishError extends Error {
  readonly status = 401;

  constructor() {
    super("Connect the GitHub App so Notra can open pull requests as a bot");
    this.name = "GitHubAppRequiredForPublishError";
  }
}

function selectGitHubAppInstallationForOwner<
  T extends { accountLogin: string },
>(installations: readonly T[], owner: string | null | undefined) {
  const normalizedOwner = owner?.trim().toLowerCase();
  if (!normalizedOwner) {
    return undefined;
  }

  return installations.find(
    (installation) =>
      installation.accountLogin.toLowerCase() === normalizedOwner
  );
}

/**
 * Content publishing authenticates as the GitHub App installation so
 * commits and pull requests are authored by `{slug}[bot]`. Personal access
 * tokens stay available when the GitHub App is not configured.
 */
export async function getGitHubPublishToken(
  integrationId: string,
  options?: { organizationId?: string }
) {
  if (!isGitHubAppConfigured()) {
    return getTokenForIntegrationId(integrationId, options);
  }

  const integration = await db.query.githubIntegrations.findFirst({
    where: options?.organizationId
      ? and(
          eq(githubIntegrations.id, integrationId),
          eq(githubIntegrations.organizationId, options.organizationId)
        )
      : eq(githubIntegrations.id, integrationId),
    columns: {
      githubAppInstallationId: true,
      organizationId: true,
      owner: true,
    },
  });

  if (!integration) {
    return null;
  }

  if (integration.githubAppInstallationId) {
    return createGitHubAppInstallationTokenForRecord(
      integration.githubAppInstallationId,
      options
    );
  }

  const installation = selectGitHubAppInstallationForOwner(
    await listGitHubAppInstallationsByOrganization(integration.organizationId),
    integration.owner
  );

  if (!installation) {
    throw new GitHubAppRequiredForPublishError();
  }

  return createGitHubAppInstallationTokenForRecord(installation.id, options);
}
