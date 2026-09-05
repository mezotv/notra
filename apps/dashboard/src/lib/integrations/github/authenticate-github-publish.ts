import {
  GitHubContentPublishError,
  hasGitHubStatus,
} from "./publish-content-to-github";

export async function authenticateGitHubPublish(
  getToken: () => Promise<string | null>
) {
  try {
    const token = await getToken();
    if (!token) {
      throw Object.assign(new Error("GitHub authentication required"), {
        status: 401,
      });
    }
    return token;
  } catch (error) {
    const installationMissing =
      hasGitHubStatus(error, 404) ||
      (error instanceof Error &&
        error.message === "GitHub App installation not found");
    throw new GitHubContentPublishError(
      "Failed to authenticate with GitHub",
      installationMissing
        ? Object.assign(
            new Error("GitHub App installation not found", { cause: error }),
            {
              status: 401,
            }
          )
        : error
    );
  }
}
