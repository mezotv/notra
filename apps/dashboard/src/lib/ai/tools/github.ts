import { type Tool, tool } from "ai";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { createOctokit } from "@/lib/octokit";
import { getGitHubToolRepositoryContextByIntegrationId } from "@/lib/services/github-integration";
import type { AgentDataPointSettings } from "@/types/ai/agents";
import type {
  CommitWindow,
  ErrorWithStatus,
  GitHubSelectionFilters,
  GitHubToolsAccessConfig,
} from "@/types/ai/tools";
import { toolDescription } from "@/utils/ai/description";
import { getAICachedTools } from "./tool-cache";

const GITHUB_PRIMARY_RATE_LIMIT_MESSAGE =
  "GitHub API rate limit reached. Please retry later.";
const LINK_HEADER_NEXT_PAGE_REGEX = /<([^>]+)>\s*;\s*rel="next"/i;

function parseRetryAfterSeconds(value?: string | number) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getHeaderCaseInsensitive(
  headers: Record<string, string | number | undefined> | undefined,
  name: string
) {
  if (!headers) {
    return undefined;
  }

  const key = Object.keys(headers).find(
    (headerName) => headerName.toLowerCase() === name.toLowerCase()
  );

  if (!key) {
    return undefined;
  }

  return headers[key];
}

export class GitHubRateLimitError extends Error {
  readonly retryAfterSeconds?: number;

  constructor(retryAfterSeconds?: number) {
    super(GITHUB_PRIMARY_RATE_LIMIT_MESSAGE);
    this.name = "GitHubRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isGitHubRateLimitError(
  error: unknown
): error is GitHubRateLimitError {
  if (error instanceof GitHubRateLimitError) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: string;
    message?: string;
    cause?: unknown;
  };

  if (candidate.name === "GitHubRateLimitError") {
    return true;
  }

  if (candidate.message?.includes(GITHUB_PRIMARY_RATE_LIMIT_MESSAGE)) {
    return true;
  }

  if (candidate.cause) {
    return isGitHubRateLimitError(candidate.cause);
  }

  return false;
}

function toGitHubRateLimitError(error: unknown) {
  const maybeError = error as ErrorWithStatus;
  const status = maybeError?.status;
  const headers = maybeError?.response?.headers;

  const remaining = getHeaderCaseInsensitive(headers, "x-ratelimit-remaining");
  const retryAfter = getHeaderCaseInsensitive(headers, "retry-after");
  const resetAt = getHeaderCaseInsensitive(headers, "x-ratelimit-reset");
  const retryAfterSecondsFromHeader = parseRetryAfterSeconds(retryAfter);

  let retryAfterSeconds = retryAfterSecondsFromHeader;
  if (!retryAfterSeconds) {
    const resetEpochSeconds = parseRetryAfterSeconds(resetAt);
    if (resetEpochSeconds) {
      const nowEpochSeconds = Math.floor(Date.now() / 1000);
      const diff = resetEpochSeconds - nowEpochSeconds;
      retryAfterSeconds = diff > 0 ? diff : undefined;
    }
  }

  const isRateLimitedByStatus = status === 429;
  const isRateLimitedByForbidden =
    status === 403 && String(remaining ?? "") === "0";
  const isSecondaryRateLimit =
    status === 403 &&
    maybeError?.message?.toLowerCase().includes("secondary rate limit") ===
      true;

  if (
    isRateLimitedByStatus ||
    isRateLimitedByForbidden ||
    isSecondaryRateLimit
  ) {
    return new GitHubRateLimitError(retryAfterSeconds);
  }

  return null;
}

async function withGitHubRateLimitHandling<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    const rateLimitError = toGitHubRateLimitError(error);
    if (rateLimitError) {
      throw rateLimitError;
    }
    throw error;
  }
}

function createIntegrationContextResolver(config?: GitHubToolsAccessConfig) {
  const cache = new Map<
    string,
    Promise<
      Awaited<ReturnType<typeof getGitHubToolRepositoryContextByIntegrationId>>
    >
  >();

  return async (integrationId: string) => {
    if (
      config?.allowedIntegrationIds !== undefined &&
      !config.allowedIntegrationIds.includes(integrationId)
    ) {
      throw new Error(
        `Repository access denied. Integration ID ${integrationId} is not in the allowed list.`
      );
    }

    let cached = cache.get(integrationId);
    if (!cached) {
      cached = getGitHubToolRepositoryContextByIntegrationId(integrationId, {
        organizationId: config?.organizationId,
      });
      cache.set(integrationId, cached);
      cached.catch(() => {
        cache.delete(integrationId);
      });
    }
    return cached;
  };
}

function createAllowedNumberLookup(
  values: Record<string, number[]> | undefined
) {
  if (!values) {
    return undefined;
  }

  return new Map(
    Object.entries(values).map(([integrationId, numbers]) => [
      integrationId,
      new Set(
        (numbers ?? []).map((value) => Number(value)).filter(Number.isFinite)
      ),
    ])
  );
}

function createAllowedStringLookup(
  values: Record<string, string[]> | undefined
) {
  if (!values) {
    return undefined;
  }

  return new Map(
    Object.entries(values).map(([integrationId, tags]) => [
      integrationId,
      new Set(
        (tags ?? [])
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
          .map((value) => value.toLowerCase())
      ),
    ])
  );
}

function getNextPageFromLinkHeader(
  linkHeader?: string | number
): number | undefined {
  if (typeof linkHeader !== "string" || !linkHeader.trim()) {
    return undefined;
  }
  const nextMatch = linkHeader.match(LINK_HEADER_NEXT_PAGE_REGEX);
  if (!nextMatch?.[1]) {
    return undefined;
  }
  try {
    const url = new URL(nextMatch[1]);
    const pageValue = url.searchParams.get("page");
    if (!pageValue) {
      return undefined;
    }
    const parsed = Number.parseInt(pageValue, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function createGetPullRequestsTool(
  config?: GitHubToolsAccessConfig
): Tool {
  const cached = getAICachedTools({
    organizationId: config?.organizationId,
    namespace: "github",
  });
  const resolveIntegrationContext = createIntegrationContextResolver(config);
  const allowedPullRequestNumbersByIntegrationId = createAllowedNumberLookup(
    config?.allowedPullRequestNumbersByIntegrationId
  );

  return cached(
    tool({
      description: toolDescription({
        toolName: "get_pull_requests",
        intro:
          "Gets the full details of a specific pull request from a GitHub repository including title, description, status, author, reviewers, and merge info.",
        whenToUse:
          "When user asks about a specific PR, wants to see PR details, needs to check PR status, or references a pull request by number.",
        usageNotes: `Requires integrationId and PR number.
Returns comprehensive PR data including diff stats, labels, and review state.`,
      }),
      inputSchema: z.object({
        integrationId: z
          .string()
          .describe("The integration ID for the configured repository"),
        pull_number: z
          .number()
          .describe("The number of the pull request to get the details for"),
      }),
      execute: async ({ integrationId, pull_number }) => {
        const allowedPullRequestNumbers =
          allowedPullRequestNumbersByIntegrationId?.get(integrationId);
        if (
          allowedPullRequestNumbers &&
          !allowedPullRequestNumbers.has(pull_number)
        ) {
          throw new Error(
            `Pull request #${String(pull_number)} is outside the selected item filter for integration ${integrationId}.`
          );
        }

        const resolved = await resolveIntegrationContext(integrationId);
        const octokit = createOctokit(resolved.token);
        const pullRequest = await withGitHubRateLimitHandling(() =>
          octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
            owner: resolved.owner,
            repo: resolved.repo,
            pull_number,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          })
        );
        return {
          id: pullRequest.data.id,
          number: pullRequest.data.number,
          title: pullRequest.data.title,
          body: pullRequest.data.body ?? null,
          state: pullRequest.data.state,
          isDraft: pullRequest.data.draft,
          merged: pullRequest.data.merged,
          mergeableState: pullRequest.data.mergeable_state,
          authorLogin: pullRequest.data.user?.login ?? "unknown",
          authorAssociation: pullRequest.data.author_association,
          labels: pullRequest.data.labels.map((label) =>
            typeof label === "string" ? label : label.name
          ),
          requestedReviewers: (pullRequest.data.requested_reviewers ?? []).map(
            (reviewer) => reviewer.login
          ),
          head: {
            ref: pullRequest.data.head.ref,
            sha: pullRequest.data.head.sha,
          },
          base: {
            ref: pullRequest.data.base.ref,
            sha: pullRequest.data.base.sha,
          },
          stats: {
            commits: pullRequest.data.commits,
            additions: pullRequest.data.additions,
            deletions: pullRequest.data.deletions,
            changedFiles: pullRequest.data.changed_files,
            comments: pullRequest.data.comments,
            reviewComments: pullRequest.data.review_comments,
          },
          createdAt: pullRequest.data.created_at,
          updatedAt: pullRequest.data.updated_at,
          closedAt: pullRequest.data.closed_at,
          mergedAt: pullRequest.data.merged_at,
          htmlUrl: pullRequest.data.html_url,
        };
      },
    }),
    {
      // PR details can change (reviews/merge), but for changelog generation we
      // mostly re-request the same PR within a short time window.
      ttl: 10 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId, pull_number } = params as {
          integrationId: string;
          pull_number: number;
        };
        return `get_pull_requests:integration=${integrationId}#${String(pull_number)}`;
      },
    }
  );
}

export function createGetReleaseByTagTool(
  config?: GitHubToolsAccessConfig
): Tool {
  const cached = getAICachedTools({
    organizationId: config?.organizationId,
    namespace: "github",
  });
  const resolveIntegrationContext = createIntegrationContextResolver(config);
  const allowedReleaseTagsByIntegrationId = createAllowedStringLookup(
    config?.allowedReleaseTagsByIntegrationId
  );
  const hasReleaseSelectionFilter =
    config?.allowedReleaseTagsByIntegrationId !== undefined ||
    config?.allowedReleaseTagsGlobal !== undefined;
  const allowedReleaseTagsGlobal =
    config?.allowedReleaseTagsGlobal !== undefined
      ? new Set(
          config.allowedReleaseTagsGlobal
            .map((value) => value.trim().toLowerCase())
            .filter((value) => value.length > 0)
        )
      : undefined;

  return cached(
    tool({
      description: toolDescription({
        toolName: "get_release_by_tag",
        intro:
          "Gets release details from a GitHub repository by tag name including release notes, assets, and publish date.",
        whenToUse:
          "When user asks about a specific release version, wants changelog or release notes, or needs to find release assets and downloads.",
        usageNotes: `Use 'latest' as the tag if the user wants the most recent release and doesn't specify a version.
Returns release body (changelog), assets list, author, and timestamps.`,
      }),
      inputSchema: z.object({
        integrationId: z
          .string()
          .describe("The integration ID for the configured repository"),
        tag: z
          .string()
          .default("latest")
          .describe(
            "The tag of the release to get the details for. Use 'latest' if you don't know the tag"
          ),
      }),
      execute: async ({ integrationId, tag }) => {
        const normalizedTag = tag.trim().toLowerCase();
        const isLatestRequest = normalizedTag === "latest";
        const allowedTagsForIntegration =
          allowedReleaseTagsByIntegrationId?.get(integrationId);

        if (hasReleaseSelectionFilter && !isLatestRequest) {
          const isAllowedForIntegration =
            allowedTagsForIntegration?.has(normalizedTag) ?? false;
          const isAllowedGlobally =
            allowedReleaseTagsGlobal?.has(normalizedTag) ?? false;

          if (!isAllowedForIntegration && !isAllowedGlobally) {
            throw new Error(
              `Release tag "${tag}" is outside the selected item filter for integration ${integrationId}.`
            );
          }
        }

        const resolved = await resolveIntegrationContext(integrationId);
        const octokit = createOctokit(resolved.token);

        const endpoint = isLatestRequest
          ? "GET /repos/{owner}/{repo}/releases/latest"
          : "GET /repos/{owner}/{repo}/releases/tags/{tag}";
        const releases = await withGitHubRateLimitHandling(() =>
          octokit.request(endpoint, {
            owner: resolved.owner,
            repo: resolved.repo,
            ...(isLatestRequest ? {} : { tag }),
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          })
        );

        if (isLatestRequest && hasReleaseSelectionFilter) {
          const resolvedTag = releases.data.tag_name.trim().toLowerCase();
          const isAllowedForIntegration =
            allowedTagsForIntegration?.has(resolvedTag) ?? false;
          const isAllowedGlobally =
            allowedReleaseTagsGlobal?.has(resolvedTag) ?? false;

          if (!isAllowedForIntegration && !isAllowedGlobally) {
            throw new Error(
              `Latest release tag "${releases.data.tag_name}" is outside the selected item filter for integration ${integrationId}.`
            );
          }
        }

        return {
          id: releases.data.id,
          tagName: releases.data.tag_name,
          targetCommitish: releases.data.target_commitish,
          name: releases.data.name ?? null,
          body: releases.data.body ?? null,
          draft: releases.data.draft,
          prerelease: releases.data.prerelease,
          immutable: releases.data.immutable,
          authorLogin: releases.data.author?.login ?? "unknown",
          createdAt: releases.data.created_at,
          publishedAt: releases.data.published_at ?? null,
          updatedAt: releases.data.updated_at ?? null,
          htmlUrl: releases.data.html_url,
          discussionUrl: releases.data.discussion_url ?? null,
          mentionsCount: releases.data.mentions_count ?? 0,
          assets: releases.data.assets.map((asset) => ({
            id: asset.id,
            name: asset.name,
            label: asset.label ?? null,
            contentType: asset.content_type,
            state: asset.state,
            size: asset.size,
            downloadCount: asset.download_count,
            browserDownloadUrl: asset.browser_download_url,
          })),
        };
      },
    }),
    {
      ttl: 30 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId, tag } = params as {
          integrationId: string;
          tag?: string;
        };
        return `get_release_by_tag:integration=${integrationId}@${String(tag ?? "latest").toLowerCase()}`;
      },
    }
  );
}

export const getISODateFromDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export function createGetCommitsByTimeframeTool(
  config?: GitHubToolsAccessConfig
): Tool {
  const cached = getAICachedTools({
    organizationId: config?.organizationId,
    namespace: "github",
  });
  const resolveIntegrationContext = createIntegrationContextResolver(config);
  const allowedCommitShas =
    config?.allowedCommitShas !== undefined
      ? new Set(
          config.allowedCommitShas
            .map((value) => value.trim().toLowerCase())
            .filter((value) => value.length > 0)
        )
      : undefined;

  return cached(
    tool({
      description: toolDescription({
        toolName: "get_commits_by_timeframe",
        intro:
          "Gets one paginated batch of commits from a repository within a specific timeframe. Returns commit details plus pagination metadata.",
        whenToUse:
          "When user asks about recent commits, wants to see what changed in the last week/month, or needs commit history for a time period.",
        usageNotes: `Use the timeframe requested in the prompt or user request.
Use this for activity summaries, changelog generation, or understanding recent changes.`,
      }),
      inputSchema: z.object({
        integrationId: z
          .string()
          .describe("The integration ID for the configured repository"),
        page: z
          .number()
          .int()
          .min(1)
          .default(1)
          .describe("The page number to retrieve (starts at 1)"),
        since: z
          .string()
          .datetime()
          .optional()
          .describe("UTC ISO timestamp for the start of the range"),
        until: z
          .string()
          .datetime()
          .optional()
          .describe("UTC ISO timestamp for the end of the range"),
        days: z
          .number()
          .default(7)
          .optional()
          .describe(
            "Deprecated fallback. Prefer since/until timestamps for exact windows."
          ),
      }),
      execute: async ({ integrationId, days, page, since, until }) => {
        const resolved = await resolveIntegrationContext(integrationId);

        const octokit = createOctokit(resolved.token);
        const effectiveSince =
          since ??
          config?.enforcedCommitWindow?.since ??
          getISODateFromDaysAgo(days ?? 7);
        const effectiveUntil =
          until ??
          config?.enforcedCommitWindow?.until ??
          new Date().toISOString();
        const response = await withGitHubRateLimitHandling(() =>
          octokit.request("GET /repos/{owner}/{repo}/commits", {
            owner: resolved.owner,
            repo: resolved.repo,
            since: effectiveSince,
            page,
            ...(resolved.defaultBranch ? { sha: resolved.defaultBranch } : {}),
            until: effectiveUntil,
            per_page: 100,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          })
        );

        const nextPage = getNextPageFromLinkHeader(response.headers?.link);
        const allCommits = response.data.map((commit) => ({
          sha: commit.sha,
          message: commit.commit.message,
          authorName:
            commit.author?.login ?? commit.commit.author?.name ?? "unknown",
          authoredAt: commit.commit.author?.date ?? null,
          url: commit.html_url,
        }));

        const commits = allowedCommitShas
          ? allCommits.filter((commit) =>
              allowedCommitShas.has(commit.sha.trim().toLowerCase())
            )
          : allCommits;

        const hasNextPage =
          nextPage !== undefined &&
          !(allowedCommitShas && commits.length === 0);

        return {
          commits,
          pagination: {
            page,
            perPage: 100,
            hasNextPage,
            nextPage: hasNextPage ? (nextPage ?? null) : null,
          },
        };
      },
    }),
    {
      // Commit lists change frequently; keep TTL short to reduce staleness while
      // still eliminating duplicate calls within a single agent run.
      ttl: 2 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId, since, until, days, page } = params as {
          integrationId: string;
          since?: string;
          until?: string;
          days?: number;
          page?: number;
        };
        const cacheSince =
          since ?? config?.enforcedCommitWindow?.since ?? "auto";
        const cacheUntil =
          until ?? config?.enforcedCommitWindow?.until ?? "auto";
        return `get_commits_by_timeframe:integration=${integrationId}:since=${cacheSince}:until=${cacheUntil}:days=${String(days ?? "none")}:page=${String(page ?? 1)}`;
      },
    }
  );
}

interface BuildGitHubDataToolsOptions {
  organizationId: string;
  allowedIntegrationIds: string[];
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
}

export function buildGitHubDataTools(
  options: BuildGitHubDataToolsOptions
): Record<string, Tool> {
  const {
    organizationId,
    allowedIntegrationIds,
    dataPointSettings,
    selectionFilters,
    commitWindow,
  } = options;

  const includePullRequests = dataPointSettings?.includePullRequests !== false;
  const includeCommits = dataPointSettings?.includeCommits !== false;
  const includeReleases = dataPointSettings?.includeReleases !== false;

  return {
    ...(includePullRequests
      ? {
          getPullRequests: createGetPullRequestsTool({
            organizationId,
            allowedIntegrationIds,
            allowedPullRequestNumbersByIntegrationId:
              selectionFilters?.allowedPullRequestNumbersByIntegrationId,
          }),
        }
      : {}),
    ...(includeReleases
      ? {
          getReleaseByTag: createGetReleaseByTagTool({
            organizationId,
            allowedIntegrationIds,
            allowedReleaseTagsByIntegrationId:
              selectionFilters?.allowedReleaseTagsByIntegrationId,
            allowedReleaseTagsGlobal:
              selectionFilters?.allowedReleaseTagsGlobal,
          }),
        }
      : {}),
    ...(includeCommits
      ? {
          getCommitsByTimeframe: createGetCommitsByTimeframeTool({
            organizationId,
            allowedIntegrationIds,
            allowedCommitShas: selectionFilters?.allowedCommitShas,
            enforcedCommitWindow: commitWindow,
          }),
        }
      : {}),
  };
}
