import { getGitHubToolRepositoryContextByIntegrationId } from "@notra/ai/integrations/github";
import { createOctokit } from "@notra/ai/utils/octokit";
import { defineTool } from "eve/tools";
import { getPullRequestsInputSchema } from "../schemas/assistant-tools";
import {
  assertPullRequestAllowed,
  getGenerationConfig,
} from "../utils/generation-config";
import { withGitHubRateLimitHandling } from "../utils/github";
import { requireOrganizationId } from "../utils/organization";

export function createGetPullRequestsTool() {
  return defineTool({
    description:
      "Get full details of a GitHub pull request (title, body, status, reviewers, diff stats, labels). Requires integrationId and pull_number. Requires a connected GitHub integration; use get_available_integrations to discover integrationIds.",
    inputSchema: getPullRequestsInputSchema,
    async execute({ integrationId, pull_number }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      assertPullRequestAllowed(
        getGenerationConfig(ctx),
        integrationId,
        pull_number
      );

      const resolved = await getGitHubToolRepositoryContextByIntegrationId(
        integrationId,
        { organizationId }
      );
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
  });
}
