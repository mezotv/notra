import { getGitHubToolRepositoryContextByIntegrationId } from "@notra/ai/integrations/github";
import { createOctokit } from "@notra/ai/utils/octokit";
import { defineTool } from "eve/tools";

import { GITHUB_COMMITS_PER_PAGE } from "../constants/github-tools";
import { getCommitsByTimeframeInputSchema } from "../schemas/assistant-tools";
import {
  getAllowedCommitShaSet,
  getGenerationConfig,
} from "../utils/generation-config";
import {
  getISODateFromDaysAgo,
  getNextPageFromLinkHeader,
  withGitHubRateLimitHandling,
} from "../utils/github";
import { requireOrganizationId } from "../utils/organization";

export function createGetCommitsByTimeframeTool() {
  return defineTool({
    description:
      "Get paginated GitHub commits within a timeframe. Prefer since/until ISO timestamps over the days fallback. Requires a connected GitHub integration; use get_available_integrations to discover integrationIds.",
    inputSchema: getCommitsByTimeframeInputSchema,
    async execute({ integrationId, days, page, since, until }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const generationConfig = getGenerationConfig(ctx);
      const allowedCommitShas = getAllowedCommitShaSet(generationConfig);

      const resolved = await getGitHubToolRepositoryContextByIntegrationId(
        integrationId,
        { organizationId }
      );
      const octokit = createOctokit(resolved.token);
      const effectiveSince =
        since ??
        generationConfig.commitWindow?.since ??
        getISODateFromDaysAgo(days ?? 7);
      const effectiveUntil =
        until ??
        generationConfig.commitWindow?.until ??
        new Date().toISOString();
      const response = await withGitHubRateLimitHandling(() =>
        octokit.request("GET /repos/{owner}/{repo}/commits", {
          owner: resolved.owner,
          repo: resolved.repo,
          since: effectiveSince,
          page,
          ...(resolved.defaultBranch ? { sha: resolved.defaultBranch } : {}),
          until: effectiveUntil,
          per_page: GITHUB_COMMITS_PER_PAGE,
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
        nextPage !== undefined && !(allowedCommitShas && commits.length === 0);

      return {
        commits,
        pagination: {
          page,
          perPage: GITHUB_COMMITS_PER_PAGE,
          hasNextPage,
          nextPage: hasNextPage ? (nextPage ?? null) : null,
        },
      };
    },
  });
}
