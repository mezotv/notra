import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import {
  COMMITS_PER_PAGE,
  GITHUB_API_BASE,
  LATEST_RELEASES_LIMIT,
  RECENT_COMMIT_SUBJECTS_LIMIT,
  RELEASES_PER_PAGE,
} from "../../../lib/constants/github";
import {
  githubCommitListSchema,
  githubReleaseListSchema,
} from "../../../lib/schemas/github-activity";

function buildGithubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "notra-onboarding-agent",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  return headers;
}

export default defineTool({
  description:
    "Fetch a public GitHub repository's recent activity: published releases and recent commits. Use it to learn how the team ships (release cadence, commit frequency) so the caller can suggest matching content workflows like changelog posts.",
  inputSchema: z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
  }),
  async execute({ owner, repo }) {
    const headers = buildGithubHeaders();

    const [releasesResponse, commitsResponse] = await Promise.all([
      fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases?per_page=${RELEASES_PER_PAGE}`,
        { headers }
      ),
      fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${COMMITS_PER_PAGE}`,
        { headers }
      ),
    ]);

    if (!(releasesResponse.ok || commitsResponse.ok)) {
      throw new Error(
        `GitHub activity requests for ${owner}/${repo} failed with statuses ${releasesResponse.status} and ${commitsResponse.status}`
      );
    }

    const releases = releasesResponse.ok
      ? githubReleaseListSchema
          .parse(await releasesResponse.json())
          .filter((release) => !release.draft)
      : [];
    const commits = commitsResponse.ok
      ? githubCommitListSchema.parse(await commitsResponse.json())
      : [];

    return {
      commitCount: commits.length,
      lastCommitAt: commits[0]?.commit.author?.date ?? null,
      latestReleases: releases
        .slice(0, LATEST_RELEASES_LIMIT)
        .map((release) => ({
          name: release.name,
          prerelease: release.prerelease,
          publishedAt: release.published_at,
          tagName: release.tag_name,
        })),
      recentCommitSubjects: commits
        .slice(0, RECENT_COMMIT_SUBJECTS_LIMIT)
        .map((commit) => commit.commit.message.split("\n")[0]),
      releaseCount: releases.length,
      usesReleases: releases.length > 0,
    };
  },
});
