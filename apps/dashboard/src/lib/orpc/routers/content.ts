import { createLinearClient } from "@notra/ai/utils/linear";
import { createOctokit } from "@notra/ai/utils/octokit";
import { sanitizeMarkdownHtml } from "@notra/ai/utils/sanitize";
import { createContentGenerationRequestSchema } from "@notra/content-generation/schemas";
import { db } from "@notra/db/drizzle";
import { githubIntegrations, posts } from "@notra/db/schema";
import { eachDayOfInterval, endOfYear, format, startOfYear } from "date-fns";
import {
  and,
  desc,
  eq,
  gte,
  type InferSelectModel,
  inArray,
  lt,
  lte,
  or,
} from "drizzle-orm";
import { marked } from "marked";
import { z } from "zod";
import {
  GITHUB_API_MAX_PAGES,
  GITHUB_API_MAX_RESULTS,
  GITHUB_API_PAGE_SIZE,
} from "@/constants/content-preview";
import { FEATURES } from "@/constants/features";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { autumn } from "@/lib/billing/autumn";
import {
  addActiveGeneration,
  clearCompletedGeneration,
  generateRunId,
  getActiveGenerations,
  getCompletedGenerations,
} from "@/lib/generations/tracking";
import { baseProcedure } from "@/lib/orpc/base";
import { getTokenForIntegrationId } from "@/lib/services/github-integration";
import {
  getDecryptedLinearToken,
  getLinearIntegrationsByOrganization,
} from "@/lib/services/linear-integration";
import { triggerOnDemandContent } from "@/lib/triggers/qstash";
import { contentListQuerySchema } from "@/schemas/api-params";
import type { ContentResponse, PostsResponse } from "@/schemas/content";
import { updateContentSchema } from "@/schemas/content";
import { clearCompletedGenerationSchema } from "@/schemas/generations";
import { LOOKBACK_WINDOWS } from "@/schemas/integrations";
import type { AutumnCheckResponse } from "@/types/autumn";
import { resolveLookbackRange } from "@/utils/lookback";
import {
  badRequest,
  internalServerError,
  notFound,
  paymentRequired,
} from "../utils/errors";

const TITLE_REGEX = /^#\s+(.+)$/m;

const organizationIdInputSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

const contentInputSchema = organizationIdInputSchema.extend({
  contentId: z.string().min(1, "Content ID is required"),
});

const previewRequestSchema = z.object({
  repositoryIds: z.array(z.string().min(1)),
  lookbackWindow: z.enum(LOOKBACK_WINDOWS),
  includeCommits: z.boolean().default(true),
  includePullRequests: z.boolean().default(true),
  includeReleases: z.boolean().default(true),
  linearIntegrationIds: z.array(z.string().min(1)).optional(),
});

type PostRecord = InferSelectModel<typeof posts>;

interface CursorData {
  createdAt: string;
  id: string;
}

function serializePost(post: {
  content: string;
  contentType: string;
  createdAt: Date;
  id: string;
  markdown: string;
  recommendations: string | null;
  status: "draft" | "published";
  title: string;
  updatedAt: Date;
}): PostsResponse["posts"][number] {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    markdown: post.markdown,
    recommendations: post.recommendations,
    contentType:
      post.contentType as PostsResponse["posts"][number]["contentType"],
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

function serializeContent(post: {
  content: string;
  contentType: string;
  createdAt: Date;
  id: string;
  markdown: string;
  recommendations: string | null;
  sourceMetadata: unknown;
  status: "draft" | "published";
  title: string;
}): ContentResponse {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    markdown: post.markdown,
    recommendations: post.recommendations,
    contentType: post.contentType as ContentResponse["contentType"],
    status: post.status,
    date: post.createdAt.toISOString(),
    sourceMetadata: post.sourceMetadata as ContentResponse["sourceMetadata"],
  };
}

export interface CommitPreview {
  authorName: string;
  authoredAt: string;
  htmlUrl: string;
  message: string;
  sha: string;
}

export interface PullRequestPreview {
  authorLogin: string;
  htmlUrl: string;
  merged: boolean;
  mergedAt: string | null;
  number: number;
  state: string;
  title: string;
}

export interface ReleasePreview {
  authorLogin: string;
  htmlUrl: string;
  name: string;
  prerelease: boolean;
  publishedAt: string;
  tagName: string;
}

export interface RepositoryPreview {
  commits: CommitPreview[];
  owner: string;
  pullRequests: PullRequestPreview[];
  releases: ReleasePreview[];
  repo: string;
  repositoryId: string;
}

export interface LinearIssuePreviewItem {
  id: string;
  identifier: string;
  title: string;
  state: string | null;
  assignee: string | null;
  completedAt: string | null;
  url: string;
}

export interface LinearIntegrationPreviewItem {
  integrationId: string;
  displayName: string;
  issues: LinearIssuePreviewItem[];
}

type PreviewFailureStage =
  | "repository_lookup"
  | "repository_metadata"
  | "token"
  | "commits"
  | "pull_requests"
  | "releases";

export interface RepositoryPreviewFailure {
  message: string;
  owner: string | null;
  repo: string | null;
  repositoryId: string;
  stage: PreviewFailureStage;
}

function encodeCursor(createdAt: Date, id: string): string {
  const data: CursorData = { createdAt: createdAt.toISOString(), id };
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    return JSON.parse(decoded) as CursorData;
  } catch {
    return null;
  }
}

function getDateRange(dateParam: string | null) {
  if (!dateParam) {
    return null;
  }

  const baseDate = dateParam === "today" ? new Date() : new Date(dateParam);

  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const startDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );
  const endDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + 1
  );

  return { startDate, endDate };
}

function formatFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown error";
}

export async function buildContentUpdateData(
  existingTitle: string,
  input: {
    markdown?: string;
    status?: "draft" | "published";
    title?: string;
  }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  if (input.markdown !== undefined) {
    const titleMatch = input.markdown.match(TITLE_REGEX);
    updateData.markdown = input.markdown;

    if (input.title === undefined) {
      updateData.title = titleMatch?.[1] ?? existingTitle;
    }

    updateData.content = sanitizeMarkdownHtml(
      await marked.parse(input.markdown)
    );
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  return updateData;
}

async function fetchReleasesPreview(params: {
  end: Date;
  octokit: ReturnType<typeof createOctokit>;
  owner: string;
  repo: string;
  start: Date;
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
  end: Date;
  octokit: ReturnType<typeof createOctokit>;
  owner: string;
  repo: string;
  start: Date;
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

    for (const pullRequest of pullRequests) {
      if (!pullRequest.merged_at) {
        continue;
      }

      const mergedAt = new Date(pullRequest.merged_at);

      if (mergedAt < start || mergedAt > end) {
        continue;
      }

      mergedPullRequests.push({
        number: pullRequest.number,
        title: pullRequest.title,
        state: pullRequest.state,
        merged: true,
        authorLogin: pullRequest.user?.login ?? "Unknown",
        mergedAt: pullRequest.merged_at,
        htmlUrl: pullRequest.html_url,
      });
    }

    if (pullRequests.length < GITHUB_API_PAGE_SIZE) {
      break;
    }

    const oldestUpdatedAt = pullRequests.at(-1)?.updated_at;

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
  end: Date;
  octokit: ReturnType<typeof createOctokit>;
  owner: string;
  repo: string;
  start: Date;
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

    for (const commit of commits) {
      results.push({
        sha: commit.sha,
        message: commit.commit.message.split("\n")[0] ?? "",
        authorName: commit.commit.author?.name ?? "Unknown",
        authoredAt: commit.commit.author?.date ?? "",
        htmlUrl: commit.html_url,
      });
    }

    if (commits.length < GITHUB_API_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return results.slice(0, GITHUB_API_MAX_RESULTS);
}

export const contentRouter = {
  list: baseProcedure
    .input(organizationIdInputSchema.and(contentListQuerySchema))
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const dateRange = getDateRange(input.date ?? null);

      if (input.date && !dateRange) {
        throw badRequest("Invalid date");
      }

      const baseFilters = [eq(posts.organizationId, input.organizationId)];

      if (dateRange) {
        baseFilters.push(
          gte(posts.createdAt, dateRange.startDate),
          lt(posts.createdAt, dateRange.endDate)
        );
      }

      let results: PostRecord[];

      if (input.cursor) {
        const cursorData = decodeCursor(input.cursor);

        if (!cursorData) {
          throw badRequest("Invalid cursor");
        }

        const cursorDate = new Date(cursorData.createdAt);

        if (Number.isNaN(cursorDate.getTime())) {
          throw badRequest("Invalid cursor");
        }

        results = await db.query.posts.findMany({
          where: and(
            ...baseFilters,
            or(
              lt(posts.createdAt, cursorDate),
              and(eq(posts.createdAt, cursorDate), lt(posts.id, cursorData.id))
            )
          ),
          orderBy: [desc(posts.createdAt), desc(posts.id)],
          limit: input.limit + 1,
        });
      } else {
        results = await db.query.posts.findMany({
          where: and(...baseFilters),
          orderBy: [desc(posts.createdAt), desc(posts.id)],
          limit: input.limit + 1,
        });
      }

      const hasMore = results.length > input.limit;
      const items = hasMore ? results.slice(0, input.limit) : results;
      const lastItem = items.at(-1);
      const nextCursor =
        hasMore && lastItem
          ? encodeCursor(lastItem.createdAt, lastItem.id)
          : null;

      return {
        posts: items.map(serializePost),
        nextCursor,
      };
    }),
  get: baseProcedure
    .input(contentInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const post = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, input.contentId),
          eq(posts.organizationId, input.organizationId)
        ),
      });

      if (!post) {
        throw notFound("Content not found");
      }

      return {
        content: serializeContent(post),
      };
    }),
  update: baseProcedure
    .input(contentInputSchema.and(updateContentSchema))
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const existingPost = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, input.contentId),
          eq(posts.organizationId, input.organizationId)
        ),
      });

      if (!existingPost) {
        throw notFound("Content not found");
      }

      const updateData = await buildContentUpdateData(
        existingPost.title,
        input
      );

      const [updatedPost] = await db
        .update(posts)
        .set(updateData)
        .where(
          and(
            eq(posts.id, input.contentId),
            eq(posts.organizationId, input.organizationId)
          )
        )
        .returning();

      if (!updatedPost) {
        throw internalServerError("Failed to update content");
      }

      return {
        success: true,
        content: serializeContent(updatedPost),
      };
    }),
  delete: baseProcedure
    .input(contentInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const existingPost = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, input.contentId),
          eq(posts.organizationId, input.organizationId)
        ),
      });

      if (!existingPost) {
        throw notFound("Content not found");
      }

      await db
        .delete(posts)
        .where(
          and(
            eq(posts.id, input.contentId),
            eq(posts.organizationId, input.organizationId)
          )
        );

      return { success: true };
    }),
  metrics: {
    get: baseProcedure
      .input(organizationIdInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const now = new Date();
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);

        const allPosts = await db
          .select({
            status: posts.status,
            createdAt: posts.createdAt,
          })
          .from(posts)
          .where(
            and(
              eq(posts.organizationId, input.organizationId),
              gte(posts.createdAt, yearStart),
              lte(posts.createdAt, yearEnd)
            )
          )
          .orderBy(posts.createdAt);

        const totalDrafts = allPosts.filter(
          (post) => post.status === "draft"
        ).length;
        const totalPublished = allPosts.filter(
          (post) => post.status === "published"
        ).length;
        const dateMap = new Map<
          string,
          { drafts: number; published: number }
        >();

        for (const post of allPosts) {
          const dateKey = format(post.createdAt, "yyyy-MM-dd");
          const entry = dateMap.get(dateKey) ?? { drafts: 0, published: 0 };

          if (post.status === "published") {
            entry.published += 1;
          } else {
            entry.drafts += 1;
          }

          dateMap.set(dateKey, entry);
        }

        const allDaysInYear = eachDayOfInterval({
          start: yearStart,
          end: yearEnd,
        });

        const maxCount = Math.max(
          ...Array.from(dateMap.values()).map(
            (value) => value.drafts + value.published
          ),
          1
        );

        const activityData = allDaysInYear.map((date) => {
          const dateKey = format(date, "yyyy-MM-dd");
          const entry = dateMap.get(dateKey) ?? { drafts: 0, published: 0 };
          const count = entry.drafts + entry.published;
          const percentage = count === 0 ? 0 : (count / maxCount) * 100;

          let level: number;

          if (count === 0) {
            level = 0;
          } else if (percentage <= 25) {
            level = 1;
          } else if (percentage <= 50) {
            level = 2;
          } else if (percentage <= 75) {
            level = 3;
          } else {
            level = 4;
          }

          return {
            date: dateKey,
            count,
            drafts: entry.drafts,
            published: entry.published,
            level,
          };
        });

        return {
          drafts: totalDrafts,
          published: totalPublished,
          graph: {
            activity: activityData,
          },
        };
      }),
  },
  preview: baseProcedure
    .input(organizationIdInputSchema.and(previewRequestSchema))
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const lookback = resolveLookbackRange(input.lookbackWindow);
      const repositories = await db
        .select({
          id: githubIntegrations.id,
          owner: githubIntegrations.owner,
          repo: githubIntegrations.repo,
        })
        .from(githubIntegrations)
        .where(
          and(
            eq(githubIntegrations.organizationId, input.organizationId),
            eq(githubIntegrations.enabled, true),
            inArray(githubIntegrations.id, input.repositoryIds)
          )
        );

      const failures: RepositoryPreviewFailure[] = [];
      const repoById = new Map(
        repositories.map((repository) => [repository.id, repository])
      );

      for (const repositoryId of input.repositoryIds) {
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
          repository
        ): repository is (typeof repositories)[number] & {
          owner: string;
          repo: string;
        } => {
          if (repository.owner && repository.repo) {
            return true;
          }

          failures.push({
            repositoryId: repository.id,
            owner: repository.owner,
            repo: repository.repo,
            stage: "repository_metadata",
            message: "Repository is missing owner or name",
          });

          return false;
        }
      );

      const repositoryResults = await Promise.all(
        validRepos.map(async (repository) => {
          let token: string | null = null;

          try {
            token = await getTokenForIntegrationId(repository.id);
          } catch (error) {
            return {
              repository: null,
              failures: [
                {
                  repositoryId: repository.id,
                  owner: repository.owner,
                  repo: repository.repo,
                  stage: "token" as const,
                  message: formatFailureMessage(error),
                },
              ],
            };
          }

          const octokit = createOctokit(token ?? undefined);
          const [commitsResult, pullsResult, releasesResult] =
            await Promise.allSettled([
              input.includeCommits
                ? fetchCommitsPreview({
                    octokit,
                    owner: repository.owner,
                    repo: repository.repo,
                    start: lookback.start,
                    end: lookback.end,
                  })
                : Promise.resolve([]),
              input.includePullRequests
                ? fetchMergedPullRequestsPreview({
                    octokit,
                    owner: repository.owner,
                    repo: repository.repo,
                    start: lookback.start,
                    end: lookback.end,
                  })
                : Promise.resolve([]),
              input.includeReleases
                ? fetchReleasesPreview({
                    octokit,
                    owner: repository.owner,
                    repo: repository.repo,
                    start: lookback.start,
                    end: lookback.end,
                  })
                : Promise.resolve([]),
            ]);

          const repoFailures: RepositoryPreviewFailure[] = [];
          const commits =
            commitsResult.status === "fulfilled" ? commitsResult.value : [];

          if (commitsResult.status === "rejected") {
            repoFailures.push({
              repositoryId: repository.id,
              owner: repository.owner,
              repo: repository.repo,
              stage: "commits",
              message: formatFailureMessage(commitsResult.reason),
            });
          }

          const pullRequests =
            pullsResult.status === "fulfilled" ? pullsResult.value : [];

          if (pullsResult.status === "rejected") {
            repoFailures.push({
              repositoryId: repository.id,
              owner: repository.owner,
              repo: repository.repo,
              stage: "pull_requests",
              message: formatFailureMessage(pullsResult.reason),
            });
          }

          const releases =
            releasesResult.status === "fulfilled" ? releasesResult.value : [];

          if (releasesResult.status === "rejected") {
            repoFailures.push({
              repositoryId: repository.id,
              owner: repository.owner,
              repo: repository.repo,
              stage: "releases",
              message: formatFailureMessage(releasesResult.reason),
            });
          }

          return {
            repository: {
              repositoryId: repository.id,
              owner: repository.owner,
              repo: repository.repo,
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

      let linearIntegrationPreviews: LinearIntegrationPreviewItem[] = [];

      if (input.linearIntegrationIds && input.linearIntegrationIds.length > 0) {
        const linearIntegrations = await getLinearIntegrationsByOrganization(
          input.organizationId
        );
        const requestedIds = new Set(input.linearIntegrationIds);
        const enabledIntegrations = linearIntegrations.filter(
          (i) => i.enabled && requestedIds.has(i.id)
        );

        linearIntegrationPreviews = await Promise.all(
          enabledIntegrations.map(async (integration) => {
            try {
              const token = await getDecryptedLinearToken(integration.id);
              if (!token) {
                return {
                  integrationId: integration.id,
                  displayName: integration.displayName,
                  issues: [],
                };
              }

              const client = createLinearClient(token);
              const filter: Record<string, unknown> = {
                completedAt: { null: false },
              };

              if (integration.linearTeamId) {
                filter.team = { id: { eq: integration.linearTeamId } };
              }

              filter.completedAt = {
                gte: lookback.start.toISOString(),
                lte: lookback.end.toISOString(),
              };

              const issues = await client.issues({
                filter,
                first: 50,
                orderBy: "updatedAt" as never,
              });

              const items = await Promise.all(
                issues.nodes.map(async (issue) => {
                  const [state, assignee] = await Promise.all([
                    issue.state,
                    issue.assignee,
                  ]);
                  return {
                    id: issue.id,
                    identifier: issue.identifier,
                    title: issue.title,
                    state: state?.name ?? null,
                    assignee: assignee?.name ?? assignee?.displayName ?? null,
                    completedAt: issue.completedAt?.toISOString() ?? null,
                    url: issue.url,
                  };
                })
              );

              return {
                integrationId: integration.id,
                displayName: integration.displayName,
                issues: items,
              };
            } catch (error) {
              console.error(
                `[Preview] Failed to fetch Linear issues for ${integration.id}:`,
                error
              );
              return {
                integrationId: integration.id,
                displayName: integration.displayName,
                issues: [],
              };
            }
          })
        );
      }

      return {
        repositories: results,
        linearIntegrations:
          linearIntegrationPreviews.length > 0
            ? linearIntegrationPreviews
            : undefined,
        failures,
      };
    }),
  generate: baseProcedure
    .input(organizationIdInputSchema.and(createContentGenerationRequestSchema))
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      if (
        !input.dataPoints.includePullRequests &&
        !input.dataPoints.includeCommits &&
        !input.dataPoints.includeReleases &&
        !input.dataPoints.includeLinearData
      ) {
        throw badRequest("At least one data source must be enabled.");
      }

      if (input.selectedItems) {
        const hasAnySelected =
          (input.selectedItems.commitShas?.length ?? 0) > 0 ||
          (input.selectedItems.pullRequestNumbers?.length ?? 0) > 0 ||
          (input.selectedItems.releaseTagNames?.length ?? 0) > 0 ||
          (input.selectedItems.linearIssueIds?.length ?? 0) > 0;

        if (!hasAnySelected) {
          throw badRequest("At least one event must be selected.");
        }
      }

      let aiCreditReserved = false;

      if (autumn) {
        let data: AutumnCheckResponse | null = null;

        try {
          data = await autumn.check({
            customerId: input.organizationId,
            featureId: FEATURES.AI_CREDITS,
            requiredBalance: 1,
            sendEvent: true,
          });
        } catch {
          throw internalServerError("Failed to verify AI credits");
        }

        if (!data?.allowed) {
          throw paymentRequired("AI credit limit reached");
        }

        aiCreditReserved = true;
      }

      const runId = generateRunId("manual_on_demand");

      await addActiveGeneration(input.organizationId, {
        runId,
        triggerId: "manual_on_demand",
        outputType: input.contentType,
        triggerName: input.contentType,
        startedAt: new Date().toISOString(),
        source: "dashboard",
      });

      let linearIntegrationIds: string[] | undefined;
      if (input.dataPoints.includeLinearData) {
        const linearIntegrations = await getLinearIntegrationsByOrganization(
          input.organizationId
        );
        linearIntegrationIds = linearIntegrations
          .filter((i) => i.enabled)
          .map((i) => i.id);
      }

      await triggerOnDemandContent({
        organizationId: input.organizationId,
        runId,
        contentType: input.contentType,
        lookbackWindow: input.lookbackWindow,
        repositoryIds: input.repositoryIds ?? input.integrations?.github,
        brandVoiceId: input.brandIdentityId ?? input.brandVoiceId,
        dataPoints: input.dataPoints,
        selectedItems: input.selectedItems,
        linearIntegrationIds,
        aiCreditReserved,
        source: "dashboard",
      });

      return {
        success: true,
        runId,
      };
    }),
  activeGenerations: {
    list: baseProcedure
      .input(organizationIdInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const [generations, results] = await Promise.all([
          getActiveGenerations(input.organizationId),
          getCompletedGenerations(input.organizationId),
        ]);

        return { generations, results };
      }),
    clearCompleted: baseProcedure
      .input(organizationIdInputSchema.and(clearCompletedGenerationSchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await clearCompletedGeneration(input.organizationId, input.runId);

        return { success: true };
      }),
  },
};
