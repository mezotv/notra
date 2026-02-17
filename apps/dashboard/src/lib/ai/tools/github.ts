import { type Tool, tool } from "ai";
import z from "zod";
import { createOctokit } from "@/lib/octokit";
import { getGitHubToolRepositoryContextByIntegrationId } from "@/lib/services/github-integration";
import type {
  ErrorWithStatus,
  GitHubToolsAccessConfig,
} from "@/types/lib/ai/tools";
import { toolDescription } from "@/utils/ai/description";
import { getAICachedTools } from "./tool-cache";

const GITHUB_PRIMARY_RATE_LIMIT_MESSAGE =
  "GitHub API rate limit reached. Please retry later.";

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

function getNextPageFromLinkHeader(
  linkHeader?: string | number
): number | undefined {
  if (typeof linkHeader !== "string" || !linkHeader.trim()) {
    return undefined;
  }
  const nextMatch = linkHeader.match(/<([^>]+)>\s*;\s*rel="next"/i);
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
        return pullRequest.data;
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
        const resolved = await resolveIntegrationContext(integrationId);
        const octokit = createOctokit(resolved.token);
        const releases = await withGitHubRateLimitHandling(() =>
          octokit.request("GET /repos/{owner}/{repo}/releases/tags/{tag}", {
            owner: resolved.owner,
            repo: resolved.repo,
            tag,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          })
        );
        return releases.data;
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

  return cached(
    tool({
      description: toolDescription({
        toolName: "get_commits_by_timeframe",
        intro:
          "Gets one paginated batch of commits from a repository within a specified number of days. Returns commit details plus pagination metadata.",
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
        days: z
          .number()
          .default(7)
          .describe("How many days of commit history to retrieve"),
      }),
      execute: async ({ integrationId, days, page }) => {
        const resolved = await resolveIntegrationContext(integrationId);

        const octokit = createOctokit(resolved.token);
        const since = getISODateFromDaysAgo(days);
        // TODO: We need an actual todo date in the future to allow for more flexible timeframes
        const until = new Date().toISOString();
        const response = await withGitHubRateLimitHandling(() =>
          octokit.request("GET /repos/{owner}/{repo}/commits", {
            owner: resolved.owner,
            repo: resolved.repo,
            since,
            page,
            ...(resolved.defaultBranch ? { sha: resolved.defaultBranch } : {}),
            until,
            per_page: 100,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          })
        );

        const nextPage = getNextPageFromLinkHeader(response.headers?.link);

        return {
          commits: response.data,
          pagination: {
            page,
            perPage: 100,
            hasNextPage: nextPage !== undefined,
            nextPage: nextPage ?? null,
          },
        };
      },
    }),
    {
      // Commit lists change frequently; keep TTL short to reduce staleness while
      // still eliminating duplicate calls within a single agent run.
      ttl: 2 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId, days, page } = params as {
          integrationId: string;
          days: number;
          page?: number;
        };

        return `get_commits_by_timeframe:integration=${integrationId}:days=${String(days)}:page=${String(page ?? 1)}`;
      },
    }
  );
}
