import { getGitHubToolRepositoryContextByIntegrationId } from "@notra/ai/integrations/github";
import { createOctokit } from "@notra/ai/utils/octokit";
import { defineTool } from "eve/tools";

import { getReleaseByTagInputSchema } from "../schemas/assistant-tools";
import {
  assertReleaseTagAllowed,
  getGenerationConfig,
} from "../utils/generation-config";
import { withGitHubRateLimitHandling } from "../utils/github";
import { requireOrganizationId } from "../utils/organization";

export function createGetReleaseByTagTool() {
  return defineTool({
    description:
      "Get a GitHub release by tag name (release notes, assets, timestamps). Use 'latest' if no version is specified. Requires a connected GitHub integration; use get_available_integrations to discover integrationIds.",
    inputSchema: getReleaseByTagInputSchema,
    async execute({ integrationId, tag }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const generationConfig = getGenerationConfig(ctx);
      const normalizedTag = tag.trim().toLowerCase();
      const isLatestRequest = normalizedTag === "latest";

      if (!isLatestRequest) {
        assertReleaseTagAllowed(generationConfig, integrationId, tag);
      }

      const resolved = await getGitHubToolRepositoryContextByIntegrationId(
        integrationId,
        { organizationId }
      );
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

      if (isLatestRequest) {
        assertReleaseTagAllowed(
          generationConfig,
          integrationId,
          releases.data.tag_name
        );
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
  });
}
