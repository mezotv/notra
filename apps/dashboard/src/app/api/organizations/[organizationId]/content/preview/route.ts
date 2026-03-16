import { createOctokit } from "@notra/ai/utils/octokit";
import { db } from "@notra/db/drizzle";
import { githubIntegrations } from "@notra/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  GITHUB_API_MAX_PAGES,
  GITHUB_API_MAX_RESULTS,
  GITHUB_API_PAGE_SIZE,
} from "@/constants/content-preview";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { getTokenForIntegrationId } from "@/lib/services/github-integration";
import { LOOKBACK_WINDOWS } from "@/schemas/integrations";
import { resolveLookbackRange } from "@/utils/lookback";

const previewRequestSchema = z.object({
  repositoryIds: z.array(z.string().min(1)).min(1),
  lookbackWindow: z.enum(LOOKBACK_WINDOWS),
  includeCommits: z.boolean().default(true),
  includePullRequests: z.boolean().default(true),
  includeReleases: z.boolean().default(true),
});

interface CommitPreview {
  sha: string;
  message: string;
  authorName: string;
  authoredAt: string;
  htmlUrl: string;
}

interface PullRequestPreview {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  authorLogin: string;
  mergedAt: string | null;
  htmlUrl: string;
}

interface ReleasePreview {
  tagName: string;
  name: string;
  publishedAt: string;
  authorLogin: string;
  htmlUrl: string;
  prerelease: boolean;
}

interface RepositoryPreview {
  repositoryId: string;
  owner: string;
  repo: string;
  commits: CommitPreview[];
  pullRequests: PullRequestPreview[];
  releases: ReleasePreview[];
}

type PreviewFailureStage =
  | "repository_lookup"
  | "repository_metadata"
  | "token"
  | "commits"
  | "pull_requests"
  | "releases";

interface RepositoryPreviewFailure {
  repositoryId: string;
  owner: string | null;
  repo: string | null;
  stage: PreviewFailureStage;
  message: string;
}

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

function formatFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unknown error";
}

async function fetchReleasesPreview(params: {
  octokit: ReturnType<typeof createOctokit>;
  owner: string;
  repo: string;
  start: Date;
  end: Date;
}): Promise<ReleasePreview[]> {
  const { octokit, owner, repo, start, end } = params;
  const results: ReleasePreview[] = [];
  let page = 1;

  while (page <= GITHUB_API_MAX_PAGES) {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/releases",
      {
        owner,
        repo,
        per_page: GITHUB_API_PAGE_SIZE,
        page,
        headers: { "X-GitHub-Api-Version": "2022-11-28" },
      }
    );

    const releases = response.data;
    if (releases.length === 0) {
      break;
    }

    for (const release of releases) {
      if (!release.published_at) {
        continue;
      }
      const publishedDate = new Date(release.published_at);
      if (publishedDate >= start && publishedDate <= end) {
        results.push({
          tagName: release.tag_name,
          name: release.name ?? release.tag_name,
          publishedAt: release.published_at,
          authorLogin: release.author?.login ?? "Unknown",
          htmlUrl: release.html_url,
          prerelease: release.prerelease,
        });
      }
    }

    const oldest = releases.at(-1);
    if (!oldest?.published_at || new Date(oldest.published_at) < start) {
      break;
    }

    if (releases.length < GITHUB_API_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return results.slice(0, GITHUB_API_MAX_RESULTS);
}

async function fetchMergedPullRequestsPreview(params: {
  octokit: ReturnType<typeof createOctokit>;
  owner: string;
  repo: string;
  start: Date;
  end: Date;
}): Promise<PullRequestPreview[]> {
  const { octokit, owner, repo, start, end } = params;
  const mergedPullRequests: PullRequestPreview[] = [];
  let page = 1;

  while (page <= GITHUB_API_MAX_PAGES) {
    const response = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
      owner,
      repo,
      state: "closed",
      sort: "updated",
      direction: "desc",
      per_page: GITHUB_API_PAGE_SIZE,
      page,
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    });

    const pullRequests = response.data;
    if (pullRequests.length === 0) {
      break;
    }

    for (const pr of pullRequests) {
      if (!pr.merged_at) {
        continue;
      }

      const mergedAt = new Date(pr.merged_at);
      if (mergedAt < start || mergedAt > end) {
        continue;
      }

      mergedPullRequests.push({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        merged: true,
        authorLogin: pr.user?.login ?? "Unknown",
        mergedAt: pr.merged_at,
        htmlUrl: pr.html_url,
      });
    }

    if (pullRequests.length < GITHUB_API_PAGE_SIZE) {
      break;
    }

    const oldestUpdatedAt = pullRequests.at(-1)?.updated_at;
    // A merged PR cannot have merged inside the window if its last update
    // happened before the window started.
    if (!oldestUpdatedAt || new Date(oldestUpdatedAt) < start) {
      break;
    }

    page += 1;
  }

  return mergedPullRequests
    .sort((left, right) => {
      const leftMergedAt = left.mergedAt
        ? new Date(left.mergedAt).getTime()
        : 0;
      const rightMergedAt = right.mergedAt
        ? new Date(right.mergedAt).getTime()
        : 0;
      return rightMergedAt - leftMergedAt;
    })
    .slice(0, GITHUB_API_MAX_RESULTS);
}

async function fetchCommitsPreview(params: {
  octokit: ReturnType<typeof createOctokit>;
  owner: string;
  repo: string;
  start: Date;
  end: Date;
}): Promise<CommitPreview[]> {
  const { octokit, owner, repo, start, end } = params;
  const results: CommitPreview[] = [];
  let page = 1;

  while (page <= GITHUB_API_MAX_PAGES) {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner,
        repo,
        since: start.toISOString(),
        until: end.toISOString(),
        per_page: GITHUB_API_PAGE_SIZE,
        page,
        headers: { "X-GitHub-Api-Version": "2022-11-28" },
      }
    );

    const commits = response.data;
    if (commits.length === 0) {
      break;
    }

    for (const c of commits) {
      results.push({
        sha: c.sha,
        message: c.commit.message.split("\n")[0] ?? "",
        authorName: c.commit.author?.name ?? "Unknown",
        authoredAt: c.commit.author?.date ?? "",
        htmlUrl: c.html_url,
      });
    }

    if (commits.length < GITHUB_API_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return results.slice(0, GITHUB_API_MAX_RESULTS);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { organizationId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const validation = previewRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  const {
    repositoryIds,
    lookbackWindow,
    includeCommits,
    includePullRequests,
    includeReleases,
  } = validation.data;
  const lookback = resolveLookbackRange(lookbackWindow);

  const repositories = await db
    .select({
      id: githubIntegrations.id,
      owner: githubIntegrations.owner,
      repo: githubIntegrations.repo,
    })
    .from(githubIntegrations)
    .where(
      and(
        eq(githubIntegrations.organizationId, organizationId),
        eq(githubIntegrations.enabled, true),
        inArray(githubIntegrations.id, repositoryIds)
      )
    );

  const failures: RepositoryPreviewFailure[] = [];
  const repoById = new Map(
    repositories.map((repository) => [repository.id, repository])
  );

  for (const repositoryId of repositoryIds) {
    if (!repoById.has(repositoryId)) {
      failures.push({
        repositoryId,
        owner: null,
        repo: null,
        stage: "repository_lookup",
        message: "Repository was not found or is not enabled",
      });
    }
  }

  const validRepos = repositories.filter(
    (
      repo
    ): repo is (typeof repositories)[number] & {
      owner: string;
      repo: string;
    } => {
      if (repo.owner && repo.repo) {
        return true;
      }
      failures.push({
        repositoryId: repo.id,
        owner: repo.owner,
        repo: repo.repo,
        stage: "repository_metadata",
        message: "Repository is missing owner or name",
      });
      return false;
    }
  );

  const repositoryResults = await Promise.all(
    validRepos.map(async (repo) => {
      let token: string | null = null;
      try {
        token = await getTokenForIntegrationId(repo.id);
      } catch (error) {
        return {
          repository: null,
          failures: [
            {
              repositoryId: repo.id,
              owner: repo.owner,
              repo: repo.repo,
              stage: "token" as const,
              message: formatFailureMessage(error),
            },
          ],
        };
      }

      const octokit = createOctokit(token ?? undefined);
      const [commitsResult, pullsResult, releasesResult] =
        await Promise.allSettled([
          includeCommits
            ? fetchCommitsPreview({
                octokit,
                owner: repo.owner,
                repo: repo.repo,
                start: lookback.start,
                end: lookback.end,
              })
            : Promise.resolve([]),
          includePullRequests
            ? fetchMergedPullRequestsPreview({
                octokit,
                owner: repo.owner,
                repo: repo.repo,
                start: lookback.start,
                end: lookback.end,
              })
            : Promise.resolve([]),
          includeReleases
            ? fetchReleasesPreview({
                octokit,
                owner: repo.owner,
                repo: repo.repo,
                start: lookback.start,
                end: lookback.end,
              })
            : Promise.resolve([]),
        ]);

      const repoFailures: RepositoryPreviewFailure[] = [];

      const commits: CommitPreview[] =
        commitsResult.status === "fulfilled" ? commitsResult.value : [];

      if (commitsResult.status === "rejected") {
        repoFailures.push({
          repositoryId: repo.id,
          owner: repo.owner,
          repo: repo.repo,
          stage: "commits",
          message: formatFailureMessage(commitsResult.reason),
        });
      }

      const pullRequests: PullRequestPreview[] =
        pullsResult.status === "fulfilled" ? pullsResult.value : [];

      if (pullsResult.status === "rejected") {
        repoFailures.push({
          repositoryId: repo.id,
          owner: repo.owner,
          repo: repo.repo,
          stage: "pull_requests",
          message: formatFailureMessage(pullsResult.reason),
        });
      }

      const releases: ReleasePreview[] =
        releasesResult.status === "fulfilled" ? releasesResult.value : [];

      if (releasesResult.status === "rejected") {
        repoFailures.push({
          repositoryId: repo.id,
          owner: repo.owner,
          repo: repo.repo,
          stage: "releases",
          message: formatFailureMessage(releasesResult.reason),
        });
      }

      return {
        repository: {
          repositoryId: repo.id,
          owner: repo.owner,
          repo: repo.repo,
          commits,
          pullRequests,
          releases,
        } satisfies RepositoryPreview,
        failures: repoFailures,
      };
    })
  );

  const results = repositoryResults
    .map((result) => {
      failures.push(...result.failures);
      return result.repository;
    })
    .filter(
      (repository): repository is RepositoryPreview => repository !== null
    );

  return NextResponse.json({ repositories: results, failures });
}
