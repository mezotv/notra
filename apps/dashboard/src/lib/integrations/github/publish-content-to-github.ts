import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import { slugify } from "@notra/utils/slugify";

import {
  GITHUB_API_VERSION_HEADERS,
  GITHUB_CREATE_COMMIT_ON_BRANCH_MUTATION,
} from "@/constants/github";
import type {
  FindExistingGitHubPullRequestParams,
  GitHubClient,
  GitHubCreateCommitOnBranchResult,
  GitHubErrorHeaders,
  GitHubPublishContentType,
  GitHubPublishFailureKind,
  GitHubPullRequestOperation,
  GitHubPullRequestSummary,
  PublishContentDraftPullRequestParams,
  ResolveGitHubContentPathParams,
  ValidateExistingGitHubBranchParams,
} from "../../../types/integrations/github";

export class GitHubContentTargetExistsError extends Error {}

export class GitHubRepositoryEmptyError extends Error {}

export class GitHubContentBranchConflictError extends Error {
  readonly branchName: string;

  constructor(branchName: string, path: string) {
    super(
      `Branch ${branchName} contains changes that do not belong to ${path}`
    );
    this.name = "GitHubContentBranchConflictError";
    this.branchName = branchName;
  }
}

export class GitHubContentPublishError extends Error {
  readonly branchName: string | null;
  readonly cause: unknown;

  constructor(
    message: string,
    cause: unknown,
    branchName: string | null = null
  ) {
    super(message);
    this.name = "GitHubContentPublishError";
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

function getGitHubErrorHeaders(error: unknown): GitHubErrorHeaders | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  if (
    "headers" in error &&
    error.headers &&
    typeof error.headers === "object"
  ) {
    return error.headers as GitHubErrorHeaders;
  }

  if (!("response" in error)) {
    return undefined;
  }

  const response = error.response;
  if (!response || typeof response !== "object" || !("headers" in response)) {
    return undefined;
  }

  const { headers } = response;
  return headers && typeof headers === "object"
    ? (headers as GitHubErrorHeaders)
    : undefined;
}

function hasGitHubGraphQLErrorType(error: unknown, type: string) {
  if (!(error instanceof Error) || !("errors" in error)) {
    return false;
  }

  return (
    Array.isArray(error.errors) &&
    error.errors.some(
      (graphQLError) =>
        graphQLError &&
        typeof graphQLError === "object" &&
        "type" in graphQLError &&
        graphQLError.type === type
    )
  );
}

function getHeaderCaseInsensitive(
  headers: GitHubErrorHeaders | undefined,
  name: string
) {
  const key = Object.keys(headers ?? {}).find(
    (headerName) => headerName.toLowerCase() === name.toLowerCase()
  );
  return key ? headers?.[key] : undefined;
}

export function classifyGitHubPublishFailure(
  error: unknown
): GitHubPublishFailureKind {
  if (
    hasGitHubStatus(error, 401) ||
    hasGitHubGraphQLErrorType(error, "UNAUTHORIZED")
  ) {
    return "authentication";
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const isForbidden =
    hasGitHubStatus(error, 403) ||
    hasGitHubGraphQLErrorType(error, "FORBIDDEN");
  const remaining = getHeaderCaseInsensitive(
    getGitHubErrorHeaders(error),
    "x-ratelimit-remaining"
  );

  if (
    hasGitHubStatus(error, 429) ||
    String(remaining ?? "") === "0" ||
    hasGitHubGraphQLErrorType(error, "RATE_LIMITED") ||
    message.includes("secondary rate limit")
  ) {
    return "rate_limit";
  }

  if (
    message.includes("resource not accessible by integration") ||
    message.includes("permission to the resource") ||
    message.includes("insufficient scope")
  ) {
    return "permissions";
  }

  if (isForbidden) {
    return "forbidden";
  }

  return "unknown";
}

export function resolveGitHubContentPath(
  params: ResolveGitHubContentPathParams
) {
  if (params.customPath) {
    return params.customPath;
  }

  const fileName =
    slugify(params.slug ?? "") || slugify(params.title) || params.contentId;
  return `${params.directory ? `${params.directory}/` : ""}${fileName}.md`;
}

function createContentBranchName(
  path: string,
  contentType: GitHubPublishContentType,
  contentId: string
) {
  const slug = slugify(path).slice(0, 40);
  const targetHash = createHash("sha256")
    .update(`${contentId}\0${path}`)
    .digest("hex")
    .slice(0, 16);
  const prefix = contentType === "changelog" ? "changelog" : "blog-post";
  return `notra/${prefix}-${slug || "update"}-${targetHash}`;
}

function toPullRequestResult(
  pullRequest: GitHubPullRequestSummary,
  branchName: string,
  path: string,
  operation: GitHubPullRequestOperation
) {
  return {
    branchName,
    operation,
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

async function getPullRequestAfterCommit(params: {
  octokit: GitHubClient;
  owner: string;
  pullRequestNumber: number;
  repo: string;
}) {
  const { data } = await params.octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner: params.owner,
      repo: params.repo,
      pull_number: params.pullRequestNumber,
      headers: GITHUB_API_VERSION_HEADERS,
    }
  );
  return data;
}

async function isContentOnDefaultBranch(
  octokit: GitHubClient,
  params: PublishContentDraftPullRequestParams
) {
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: params.owner,
        repo: params.repo,
        path: params.path,
        ref: params.defaultBranch,
        headers: GITHUB_API_VERSION_HEADERS,
      }
    );
    return (
      !Array.isArray(data) &&
      "content" in data &&
      Buffer.from(data.content, "base64").toString("utf8") === params.markdown
    );
  } catch (error) {
    if (hasGitHubStatus(error, 404)) {
      return false;
    }
    throw new GitHubContentPublishError(
      "Failed to reconcile the published content",
      error
    );
  }
}

async function assertRecoverableContentBranch(
  params: ValidateExistingGitHubBranchParams
) {
  let branchHeadSha: string;
  try {
    const { data: branchRef } = await params.octokit.request(
      "GET /repos/{owner}/{repo}/git/ref/{ref}",
      {
        owner: params.owner,
        repo: params.repo,
        ref: `heads/${params.branchName}`,
        headers: GITHUB_API_VERSION_HEADERS,
      }
    );
    branchHeadSha = branchRef.object.sha;
  } catch (error) {
    throw new GitHubContentPublishError(
      "Failed to read the existing content branch",
      error,
      params.branchName
    );
  }

  let comparison: Awaited<ReturnType<GitHubClient["request"]>>["data"];

  try {
    const response = await params.octokit.request(
      "GET /repos/{owner}/{repo}/compare/{basehead}",
      {
        owner: params.owner,
        repo: params.repo,
        basehead: `${params.baseSha}...${branchHeadSha}`,
        headers: GITHUB_API_VERSION_HEADERS,
      }
    );
    comparison = response.data;
  } catch (error) {
    throw new GitHubContentPublishError(
      "Failed to validate the existing content branch",
      error,
      params.branchName
    );
  }

  if (!("ahead_by" in comparison) || !("files" in comparison)) {
    throw new GitHubContentBranchConflictError(params.branchName, params.path);
  }

  const files = comparison.files ?? [];
  const branchHasNoChanges = comparison.ahead_by === 0 && files.length === 0;
  const branchOnlyAddsTarget =
    files.length === 1 &&
    files[0]?.filename === params.path &&
    files[0].status === "added" &&
    !("previous_filename" in files[0]);

  if (!(branchHasNoChanges || branchOnlyAddsTarget)) {
    throw new GitHubContentBranchConflictError(params.branchName, params.path);
  }

  return branchHeadSha;
}

async function commitContentToBranch(
  octokit: GitHubClient,
  params: PublishContentDraftPullRequestParams,
  branchName: string,
  branchHeadSha: string
) {
  try {
    const result = await octokit.graphql<GitHubCreateCommitOnBranchResult>(
      GITHUB_CREATE_COMMIT_ON_BRANCH_MUTATION,
      {
        input: {
          branch: {
            repositoryNameWithOwner: `${params.owner}/${params.repo}`,
            branchName,
          },
          message: { headline: `docs: add ${params.title}` },
          expectedHeadOid: branchHeadSha,
          fileChanges: {
            additions: [
              {
                path: params.path,
                contents: Buffer.from(params.markdown).toString("base64"),
              },
            ],
          },
        },
      }
    );
    const commitSha = result.createCommitOnBranch?.commit.oid;
    if (!commitSha) {
      throw new Error("GitHub did not return the content commit");
    }
    return commitSha;
  } catch (error) {
    try {
      const { data: currentRef } = await octokit.request(
        "GET /repos/{owner}/{repo}/git/ref/{ref}",
        {
          owner: params.owner,
          repo: params.repo,
          ref: `heads/${branchName}`,
          headers: GITHUB_API_VERSION_HEADERS,
        }
      );
      if (currentRef.object.sha !== branchHeadSha) {
        throw new GitHubContentBranchConflictError(branchName, params.path);
      }
    } catch (reconciliationError) {
      if (reconciliationError instanceof GitHubContentBranchConflictError) {
        throw reconciliationError;
      }
    }
    throw new GitHubContentPublishError(
      "GitHub could not create the content commit",
      error,
      branchName
    );
  }
}

async function assertContentCommitIsBranchHead(params: {
  branchHeadBeforeCommit: string;
  branchName: string;
  commitSha: string;
  observedPullRequestHead?: string;
  octokit: GitHubClient;
  owner: string;
  path: string;
  repo: string;
}) {
  if (params.observedPullRequestHead === params.commitSha) {
    return;
  }
  if (
    params.observedPullRequestHead &&
    params.observedPullRequestHead !== params.branchHeadBeforeCommit
  ) {
    throw new GitHubContentBranchConflictError(params.branchName, params.path);
  }

  for (const retryDelay of [0, 100, 250, 500]) {
    if (retryDelay > 0) {
      await delay(retryDelay);
    }

    let currentHeadSha: string;
    try {
      const { data: currentRef } = await params.octokit.request(
        "GET /repos/{owner}/{repo}/git/ref/{ref}",
        {
          owner: params.owner,
          repo: params.repo,
          ref: `heads/${params.branchName}`,
          headers: GITHUB_API_VERSION_HEADERS,
        }
      );
      currentHeadSha = currentRef.object.sha;
    } catch (error) {
      throw new GitHubContentPublishError(
        "Failed to verify the content branch after committing",
        error,
        params.branchName
      );
    }

    if (currentHeadSha === params.commitSha) {
      return;
    }
    if (currentHeadSha !== params.branchHeadBeforeCommit) {
      throw new GitHubContentBranchConflictError(
        params.branchName,
        params.path
      );
    }
  }

  throw new GitHubContentBranchConflictError(params.branchName, params.path);
}

export async function publishContentDraftPullRequest(
  octokit: GitHubClient,
  params: PublishContentDraftPullRequestParams
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
    if (hasGitHubStatus(error, 409)) {
      throw new GitHubRepositoryEmptyError(
        `${params.owner}/${params.repo} does not have an initial commit`
      );
    }
    throw new GitHubContentPublishError(
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
      throw new GitHubContentPublishError(
        "Failed to check the destination path",
        error
      );
    }
    destinationMissing = true;
  }

  if (!destinationMissing) {
    throw new GitHubContentTargetExistsError(
      `${params.path} already exists in ${params.owner}/${params.repo}`
    );
  }

  const branchName = createContentBranchName(
    params.path,
    params.contentType,
    params.contentId
  );
  let existingPullRequest: GitHubPullRequestSummary | undefined;

  try {
    existingPullRequest = await findExistingPullRequest({
      branchName,
      defaultBranch: params.defaultBranch,
      octokit,
      owner: params.owner,
      repo: params.repo,
    });
  } catch (error) {
    throw new GitHubContentPublishError(
      "Failed to check for an existing content pull request",
      error
    );
  }

  let createdBranch = false;
  if (!existingPullRequest) {
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
          existingPullRequest = await findExistingPullRequest({
            branchName,
            defaultBranch: params.defaultBranch,
            octokit,
            owner: params.owner,
            repo: params.repo,
          });
        } catch (reconciliationError) {
          throw new GitHubContentPublishError(
            "Failed to reconcile the existing content branch",
            reconciliationError,
            branchName
          );
        }
      } else {
        throw new GitHubContentPublishError(
          "GitHub could not create the content branch",
          error
        );
      }
    }
  }

  const branchHeadSha = createdBranch
    ? baseSha
    : await assertRecoverableContentBranch({
        baseSha,
        branchName,
        octokit,
        owner: params.owner,
        path: params.path,
        repo: params.repo,
      });
  const commitSha = await commitContentToBranch(
    octokit,
    params,
    branchName,
    branchHeadSha
  );

  if (existingPullRequest) {
    let pullRequestAfterCommit: Awaited<
      ReturnType<typeof getPullRequestAfterCommit>
    >;
    try {
      pullRequestAfterCommit = await getPullRequestAfterCommit({
        octokit,
        owner: params.owner,
        pullRequestNumber: existingPullRequest.number,
        repo: params.repo,
      });
    } catch (error) {
      throw new GitHubContentPublishError(
        "Failed to verify the updated pull request",
        error,
        branchName
      );
    }
    if (pullRequestAfterCommit.state === "open") {
      await assertContentCommitIsBranchHead({
        branchHeadBeforeCommit: branchHeadSha,
        branchName,
        commitSha,
        observedPullRequestHead: pullRequestAfterCommit.head.sha,
        octokit,
        owner: params.owner,
        path: params.path,
        repo: params.repo,
      });
      return toPullRequestResult(
        existingPullRequest,
        branchName,
        params.path,
        "updated"
      );
    }
    if (await isContentOnDefaultBranch(octokit, params)) {
      return toPullRequestResult(
        existingPullRequest,
        branchName,
        params.path,
        "updated"
      );
    }
    existingPullRequest = undefined;
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
        body: `Draft ${params.contentType === "changelog" ? "changelog" : "blog post"} generated and published with Notra.`,
        draft: true,
        headers: GITHUB_API_VERSION_HEADERS,
      }
    );

    const pullRequestAfterCommit = await getPullRequestAfterCommit({
      octokit,
      owner: params.owner,
      pullRequestNumber: pullRequest.number,
      repo: params.repo,
    });
    await assertContentCommitIsBranchHead({
      branchHeadBeforeCommit: branchHeadSha,
      branchName,
      commitSha,
      observedPullRequestHead: pullRequestAfterCommit.head.sha,
      octokit,
      owner: params.owner,
      path: params.path,
      repo: params.repo,
    });

    return toPullRequestResult(pullRequest, branchName, params.path, "created");
  } catch (error) {
    if (
      error instanceof GitHubContentBranchConflictError ||
      error instanceof GitHubContentPublishError
    ) {
      throw error;
    }

    try {
      const existingPullRequest = await findExistingPullRequest({
        branchName,
        defaultBranch: params.defaultBranch,
        octokit,
        owner: params.owner,
        repo: params.repo,
      });
      if (existingPullRequest) {
        const pullRequestAfterCommit = await getPullRequestAfterCommit({
          octokit,
          owner: params.owner,
          pullRequestNumber: existingPullRequest.number,
          repo: params.repo,
        });
        await assertContentCommitIsBranchHead({
          branchHeadBeforeCommit: branchHeadSha,
          branchName,
          commitSha,
          observedPullRequestHead: pullRequestAfterCommit.head.sha,
          octokit,
          owner: params.owner,
          path: params.path,
          repo: params.repo,
        });
        return toPullRequestResult(
          existingPullRequest,
          branchName,
          params.path,
          "created"
        );
      }
    } catch (reconciliationError) {
      if (
        reconciliationError instanceof GitHubContentBranchConflictError ||
        reconciliationError instanceof GitHubContentPublishError
      ) {
        throw reconciliationError;
      }
      throw new GitHubContentPublishError(
        `GitHub may have created the draft pull request. Check branch: ${branchName}`,
        reconciliationError,
        branchName
      );
    }

    throw new GitHubContentPublishError(
      "GitHub could not create the draft pull request",
      error,
      branchName
    );
  }
}
