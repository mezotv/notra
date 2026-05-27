import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

export function createOctokit(auth?: string) {
  return new Octokit({
    auth,
  });
}

function getGitHubAppPrivateKey() {
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  return privateKey?.replace(/\\n/g, "\n");
}

export function isGitHubAppConfigured() {
  return Boolean(process.env.GITHUB_APP_ID && getGitHubAppPrivateKey());
}

export function getGitHubAppSlug() {
  return process.env.GITHUB_APP_SLUG;
}

export function createGitHubAppOctokit() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = getGitHubAppPrivateKey();

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials are not configured");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
  });
}

export async function createGitHubAppInstallationToken(
  installationId: string | number
) {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = getGitHubAppPrivateKey();

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials are not configured");
  }

  const auth = createAppAuth({
    appId,
    privateKey,
    installationId: Number(installationId),
  });
  const installationAuth = await auth({ type: "installation" });

  return installationAuth.token;
}

export async function createGitHubAppInstallationOctokit(
  installationId: string | number
) {
  const token = await createGitHubAppInstallationToken(installationId);

  return createOctokit(token);
}
