import { createHash } from "node:crypto";
import { slugify } from "@notra/utils/slugify";
import { GITHUB_API_VERSION_HEADERS } from "@/constants/github";
import type {
  FindExistingGitHubPullRequestParams,
  GetExistingGitHubFileShaParams,
  GitHubClient,
  GitHubPullRequestSummary,
  PublishChangelogDraftPullRequestParams,
  ResolveChangelogPathParams,
} from "@/types/integrations/github";

export class GitHubChangelogTargetExistsError extends Error {}

export class GitHubChangelogPublishError extends Error {
  readonly branchName: string | null;
  readonly cause: unknown;

  constructor(
    message: string,
    cause: unknown,
    branchName: string | null = null
  ) {
    super(message);
    this.name = "GitHubChangelogPublishError";
    this.branchName = branchName;
    this.cause = cause;
  }
}

export function hasGitHubStatus(error: unknown, status: number) {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status === status
  );
}

export function resolveChangelogPath(params: ResolveChangelogPathParams) {
  if (params.customPath) {
    return params.customPath;
  }

  const fileName =
    slugify(params.slug ?? "") || slugify(params.title) || params.contentId;
  return `${params.directory ? `${params.directory}/` : ""}${fileName}.md`;
}

function createChangelogBranchName(path: string) {
  const slug = slugify(path).slice(0, 40);
  const pathHash = createHash("sha256").update(path).digest("hex").slice(0, 8);
  return `notra/changelog-${slug || "update"}-${pathHash}`;
}

function toPullRequestResult(
  pullRequest: GitHubPullRequestSummary,
  branchName: string,
  path: string
) {
  return {
    branchName,
    path,
    pullRequestNumber: pullRequest.number,
    pullRequestUrl: pullRequest.html_url,
  };
}

async function findExistingPullRequest(
  params: FindExistingGitHubPullRequestParams
) {
  const { data: pullRequests } = await params.octokit.request(
    "GET /repos/{owner}/{repo}/pulls",
    {
      owner: params.owner,
      repo: params.repo,
      base: params.defaultBranch,
      head: `${params.owner}:${params.branchName}`,
      state: "open",
      per_page: 1,
      headers: GITHUB_API_VERSION_HEADERS,
    }
  );
  return pullRequests[0];
}

async function getExistingFileSha(params: GetExistingGitHubFileShaParams) {
  try {
    const { data } = await params.octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: params.owner,
        repo: params.repo,
        path: params.path,
        ref: params.branchName,
        headers: GITHUB_API_VERSION_HEADERS,
      }
    );
    return !Array.isArray(data) && "sha" in data ? data.sha : null;
  } catch (error) {
    if (hasGitHubStatus(error, 404)) {
      return null;
    }
    throw error;
  }
}

export async function publishChangelogDraftPullRequest(
  octokit: GitHubClient,
  params: PublishChangelogDraftPullRequestParams
) {
  let baseSha: string;

  try {
    const { data: baseRef } = await octokit.request(
      "GET /repos/{owner}/{repo}/git/ref/{ref}",
      {
        owner: params.owner,
        repo: params.repo,
        ref: `heads/${params.defaultBranch}`,
        headers: GITHUB_API_VERSION_HEADERS,
      }
    );
    baseSha = baseRef.object.sha;
  } catch (error) {
    throw new GitHubChangelogPublishError(
      "Failed to read the repository's default branch",
      error
    );
  }

  let destinationMissing = false;
  try {
    await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      ref: baseSha,
      headers: GITHUB_API_VERSION_HEADERS,
    });
  } catch (error) {
    if (!hasGitHubStatus(error, 404)) {
      throw new GitHubChangelogPublishError(
        "Failed to check the destination path",
        error
      );
    }
    destinationMissing = true;
  }

  if (!destinationMissing) {
    throw new GitHubChangelogTargetExistsError(
      `${params.path} already exists in ${params.owner}/${params.repo}`
    );
  }

  const branchName = createChangelogBranchName(params.path);

  try {
    const existingPullRequest = await findExistingPullRequest({
      branchName,
      defaultBranch: params.defaultBranch,
      octokit,
      owner: params.owner,
      repo: params.repo,
    });
    if (existingPullRequest) {
      return toPullRequestResult(existingPullRequest, branchName, params.path);
    }
  } catch (error) {
    throw new GitHubChangelogPublishError(
      "Failed to check for an existing changelog pull request",
      error
    );
  }

  let createdBranch = false;
  try {
    await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner: params.owner,
      repo: params.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
      headers: GITHUB_API_VERSION_HEADERS,
    });
    createdBranch = true;
  } catch (error) {
    if (hasGitHubStatus(error, 422)) {
      try {
        const existingPullRequest = await findExistingPullRequest({
          branchName,
          defaultBranch: params.defaultBranch,
          octokit,
          owner: params.owner,
          repo: params.repo,
        });
        if (existingPullRequest) {
          return toPullRequestResult(
            existingPullRequest,
            branchName,
            params.path
          );
        }
      } catch {
        // Continue with branch reconciliation below.
      }
    } else {
      throw new GitHubChangelogPublishError(
        "GitHub could not create the changelog branch",
        error
      );
    }
  }

  try {
    const existingFileSha = createdBranch
      ? null
      : await getExistingFileSha({
          branchName,
          octokit,
          owner: params.owner,
          path: params.path,
          repo: params.repo,
        });
    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      branch: branchName,
      message: `docs: add ${params.title}`,
      content: Buffer.from(params.markdown).toString("base64"),
      ...(existingFileSha ? { sha: existingFileSha } : {}),
      headers: GITHUB_API_VERSION_HEADERS,
    });
  } catch (error) {
    throw new GitHubChangelogPublishError(
      "GitHub could not create the changelog file",
      error,
      branchName
    );
  }

  try {
    const { data: pullRequest } = await octokit.request(
      "POST /repos/{owner}/{repo}/pulls",
      {
        owner: params.owner,
        repo: params.repo,
        base: params.defaultBranch,
        head: branchName,
        title: `docs: add ${params.title}`,
        body: "Draft changelog generated and published with Notra.",
        draft: true,
        headers: GITHUB_API_VERSION_HEADERS,
      }
    );

    return toPullRequestResult(pullRequest, branchName, params.path);
  } catch (error) {
    try {
      const existingPullRequest = await findExistingPullRequest({
        branchName,
        defaultBranch: params.defaultBranch,
        octokit,
        owner: params.owner,
        repo: params.repo,
      });
      if (existingPullRequest) {
        return toPullRequestResult(
          existingPullRequest,
          branchName,
          params.path
        );
      }
    } catch (reconciliationError) {
      throw new GitHubChangelogPublishError(
        `GitHub may have created the draft pull request. Check branch: ${branchName}`,
        reconciliationError,
        branchName
      );
    }

    throw new GitHubChangelogPublishError(
      "GitHub could not create the draft pull request",
      error,
      branchName
    );
  }
}
