import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { shouldApplyMarkup } from "@notra/ai/billing/token-pricing";
import { getTokenForIntegrationId } from "@notra/ai/integrations/github";
import {
  getDecryptedLinearToken,
  getLinearIntegrationsByOrganization,
} from "@notra/ai/integrations/linear";
import { triggerOnDemandContent } from "@notra/ai/qstash/triggers";
import { type ContentType, contentTypeSchema } from "@notra/ai/schemas/content";
import { supportsPostSlug } from "@notra/ai/schemas/post";
import { createLinearClient } from "@notra/ai/utils/linear";
import { createOctokit } from "@notra/ai/utils/octokit";
import { sanitizeMarkdownHtml } from "@notra/ai/utils/sanitize";
import { db } from "@notra/db/drizzle";
import { githubIntegrations, postCollections, posts } from "@notra/db/schema";
import { buildPostCollectionName } from "@notra/db/utils/post-collections";
import type { CheckResponse } from "autumn-js";
import { eachDayOfInterval, endOfYear, format, startOfYear } from "date-fns";
import { and, asc, count, desc, eq, gte, inArray, lt, lte } from "drizzle-orm";
import { marked } from "marked";
import { nanoid } from "nanoid";
import {
  GITHUB_API_MAX_PAGES,
  GITHUB_API_MAX_RESULTS,
  GITHUB_API_PAGE_SIZE,
} from "@/constants/content-preview";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { assertActiveSubscription } from "@/lib/billing/subscription";
import {
  addActiveGeneration,
  clearCompletedGeneration,
  generateRunId,
  getActiveGenerations,
  getCompletedGenerations,
} from "@/lib/generations/tracking";
import { baseProcedure } from "@/lib/orpc/base";
import { contentListQuerySchema } from "@/schemas/api-params";
import type { ContentResponse, PostsResponse } from "@/schemas/content";
import {
  contentInputSchema,
  contentOrganizationIdInputSchema,
  contentPreviewRequestSchema,
  createPostCollectionInputSchema,
  generateContentInputSchema,
  postCollectionInputSchema,
  postCollectionsListInputSchema,
  renamePostCollectionInputSchema,
  updateContentSchema,
  updateExpectedPostCountInputSchema,
} from "@/schemas/content";
import { clearCompletedGenerationSchema } from "@/schemas/generations";
import type {
  CommitPreview,
  LinearIntegrationPreviewItem,
  LinearIssuePreviewItem,
  PullRequestPreview,
  ReleasePreview,
  RepositoryPreview,
  RepositoryPreviewFailure,
} from "@/types/content/preview";
import { resolveLookbackRange } from "@/utils/lookback";
import {
  badRequest,
  conflict,
  internalServerError,
  notFound,
  paymentRequired,
} from "../utils/errors";

const TITLE_REGEX = /^#\s+(.+)$/m;

const postReadColumns = {
  id: true,
  organizationId: true,
  collectionId: true,
  title: true,
  slug: true,
  content: true,
  htmlUrl: true,
  markdown: true,
  recommendations: true,
  contentType: true,
  createdAt: true,
  sourceMetadata: true,
  status: true,
  updatedAt: true,
} as const;

function serializePost(post: {
  content: string;
  contentType: string;
  createdAt: Date;
  htmlUrl: string | null;
  id: string;
  markdown: string | null;
  sourceMetadata: unknown;
  recommendations: string | null;
  slug: string | null;
  status: "draft" | "published";
  title: string;
  updatedAt: Date;
}): PostsResponse["posts"][number] {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    htmlUrl: post.contentType === "image" ? post.htmlUrl : null,
    markdown: post.markdown,
    rawHtml: extractImageArtifactHtml(post.sourceMetadata),
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
  htmlUrl: string | null;
  id: string;
  markdown: string | null;
  recommendations: string | null;
  slug: string | null;
  sourceMetadata: unknown;
  status: "draft" | "published";
  title: string;
}): ContentResponse {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    htmlUrl: post.contentType === "image" ? post.htmlUrl : null,
    markdown: post.markdown,
    rawHtml: extractImageArtifactHtml(post.sourceMetadata),
    recommendations: post.recommendations,
    contentType: post.contentType as ContentResponse["contentType"],
    status: post.status,
    date: post.createdAt.toISOString(),
    sourceMetadata: post.sourceMetadata as ContentResponse["sourceMetadata"],
  };
}

function extractImageArtifactHtml(sourceMetadata: unknown): string | null {
  if (
    !sourceMetadata ||
    typeof sourceMetadata !== "object" ||
    Array.isArray(sourceMetadata)
  ) {
    return null;
  }

  const artifacts = (sourceMetadata as { artifacts?: unknown }).artifacts;
  if (!artifacts || typeof artifacts !== "object" || Array.isArray(artifacts)) {
    return null;
  }

  const html = (artifacts as { html?: unknown }).html;
  return typeof html === "string" && html.trim() ? html : null;
}

function normalizeContentTypes(contentTypes: string[]): ContentType[] {
  const normalized: ContentType[] = [];

  for (const contentType of contentTypes) {
    const parsed = contentTypeSchema.safeParse(contentType);
    if (parsed.success && !normalized.includes(parsed.data)) {
      normalized.push(parsed.data);
    }
  }

  return normalized;
}

function normalizeContentType(contentType: string): ContentType {
  return contentTypeSchema.parse(contentType);
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
        authorLogin: commit.author?.login ?? null,
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
    .input(contentOrganizationIdInputSchema.and(contentListQuerySchema))
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

      const whereClause = and(...baseFilters);
      const offset = (input.page - 1) * input.pageSize;

      const [items, totalCountResult] = await Promise.all([
        db.query.posts.findMany({
          where: whereClause,
          orderBy: [desc(posts.createdAt), desc(posts.id)],
          limit: input.pageSize,
          offset,
          columns: postReadColumns,
        }),
        db.select({ value: count() }).from(posts).where(whereClause),
      ]);

      const totalCount = totalCountResult[0]?.value ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalCount / input.pageSize));

      return {
        posts: items.map(serializePost),
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          totalCount,
          totalPages,
        },
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
        columns: postReadColumns,
      });

      if (!post) {
        throw notFound("Content not found");
      }

      const collection = await db.query.postCollections.findFirst({
        where: and(
          eq(postCollections.id, post.collectionId),
          eq(postCollections.organizationId, input.organizationId)
        ),
        with: {
          posts: {
            columns: {
              id: true,
              title: true,
              contentType: true,
              status: true,
            },
            orderBy: [asc(posts.createdAt), asc(posts.id)],
          },
        },
      });

      return {
        content: serializeContent(post),
        collection: collection
          ? {
              id: collection.id,
              name: collection.name,
              source: collection.source,
              siblings: collection.posts
                .filter((sibling) => sibling.id !== post.id)
                .map((sibling) => ({
                  id: sibling.id,
                  title: sibling.title,
                  contentType: normalizeContentType(sibling.contentType),
                  status: sibling.status,
                })),
            }
          : null,
      };
    }),
  update: baseProcedure
    .input(contentInputSchema.and(updateContentSchema))
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });
      await assertActiveSubscription(input.organizationId);

      const existingPost = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, input.contentId),
          eq(posts.organizationId, input.organizationId)
        ),
        columns: {
          title: true,
          contentType: true,
        },
      });

      if (!existingPost) {
        throw notFound("Content not found");
      }

      const updateData = await buildContentUpdateData(
        existingPost.title,
        input
      );

      if (input.slug !== undefined) {
        if (!supportsPostSlug(existingPost.contentType)) {
          throw badRequest(
            "Slug can only be set for blog posts and changelogs"
          );
        }
        updateData.slug = input.slug;
      }

      try {
        const [updatedPost] = await db
          .update(posts)
          .set(updateData)
          .where(
            and(
              eq(posts.id, input.contentId),
              eq(posts.organizationId, input.organizationId)
            )
          )
          .returning({
            id: posts.id,
            organizationId: posts.organizationId,
            collectionId: posts.collectionId,
            title: posts.title,
            slug: posts.slug,
            content: posts.content,
            htmlUrl: posts.htmlUrl,
            markdown: posts.markdown,
            recommendations: posts.recommendations,
            contentType: posts.contentType,
            createdAt: posts.createdAt,
            sourceMetadata: posts.sourceMetadata,
            status: posts.status,
            updatedAt: posts.updatedAt,
          });

        if (!updatedPost) {
          throw internalServerError("Failed to update content");
        }

        return {
          success: true,
          content: serializeContent(updatedPost),
        };
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23505"
        ) {
          throw conflict("A post with this slug already exists");
        }
        throw error;
      }
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
        columns: {
          id: true,
        },
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
  collections: {
    list: baseProcedure
      .input(postCollectionsListInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const whereClause = eq(
          postCollections.organizationId,
          input.organizationId
        );
        const offset = (input.page - 1) * input.pageSize;

        const [collectionRows, totalCountResult] = await Promise.all([
          db.query.postCollections.findMany({
            where: whereClause,
            orderBy: [
              desc(postCollections.createdAt),
              desc(postCollections.id),
            ],
            limit: input.pageSize,
            offset,
          }),
          db
            .select({ value: count() })
            .from(postCollections)
            .where(whereClause),
        ]);

        const collectionIds = collectionRows.map((collection) => collection.id);
        const postRows =
          collectionIds.length > 0
            ? await db
                .select({
                  collectionId: posts.collectionId,
                  contentType: posts.contentType,
                  status: posts.status,
                })
                .from(posts)
                .where(inArray(posts.collectionId, collectionIds))
            : [];

        const aggregates = new Map<
          string,
          { total: number; draft: number; published: number; types: string[] }
        >();
        for (const post of postRows) {
          const aggregate = aggregates.get(post.collectionId) ?? {
            total: 0,
            draft: 0,
            published: 0,
            types: [],
          };
          aggregate.total += 1;
          if (post.status === "published") {
            aggregate.published += 1;
          } else {
            aggregate.draft += 1;
          }
          if (!aggregate.types.includes(post.contentType)) {
            aggregate.types.push(post.contentType);
          }
          aggregates.set(post.collectionId, aggregate);
        }

        const collections = collectionRows.map((collection) => {
          const aggregate = aggregates.get(collection.id);
          const storedTypes = Array.isArray(collection.contentTypes)
            ? collection.contentTypes.filter(
                (type): type is string => typeof type === "string"
              )
            : [];
          const contentTypes = normalizeContentTypes(
            aggregate && aggregate.types.length > 0
              ? aggregate.types
              : storedTypes
          );
          const postCount = aggregate?.total ?? 0;
          const isGenerating =
            collection.expectedPostCount !== null &&
            collection.completedPostCount < collection.expectedPostCount;

          return {
            id: collection.id,
            name: collection.name,
            source: collection.source,
            nameSource: collection.nameSource,
            contentTypes,
            postCount,
            expectedPostCount: collection.expectedPostCount,
            isGenerating,
            statusSummary: {
              total: postCount,
              draft: aggregate?.draft ?? 0,
              published: aggregate?.published ?? 0,
            },
            createdAt: collection.createdAt.toISOString(),
          };
        });

        const totalCount = totalCountResult[0]?.value ?? 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / input.pageSize));

        return {
          collections,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            totalCount,
            totalPages,
          },
        };
      }),
    get: baseProcedure
      .input(postCollectionInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const collection = await db.query.postCollections.findFirst({
          where: and(
            eq(postCollections.id, input.collectionId),
            eq(postCollections.organizationId, input.organizationId)
          ),
          with: {
            posts: {
              columns: {
                id: true,
                title: true,
                content: true,
                markdown: true,
                contentType: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: [asc(posts.createdAt), asc(posts.id)],
            },
          },
        });

        if (!collection) {
          throw notFound("Post collection not found");
        }

        const storedTypes = Array.isArray(collection.contentTypes)
          ? collection.contentTypes.filter(
              (type): type is string => typeof type === "string"
            )
          : [];
        const postTypes: string[] = [];
        for (const post of collection.posts) {
          if (!postTypes.includes(post.contentType)) {
            postTypes.push(post.contentType);
          }
        }
        const isGenerating =
          collection.expectedPostCount !== null &&
          collection.completedPostCount < collection.expectedPostCount;

        return {
          collection: {
            id: collection.id,
            name: collection.name,
            source: collection.source,
            nameSource: collection.nameSource,
            contentTypes: normalizeContentTypes(
              postTypes.length > 0 ? postTypes : storedTypes
            ),
            expectedPostCount: collection.expectedPostCount,
            isGenerating,
            createdAt: collection.createdAt.toISOString(),
            posts: collection.posts.map((post) => ({
              id: post.id,
              title: post.title,
              content: post.content,
              markdown: post.markdown,
              contentType: normalizeContentType(post.contentType),
              status: post.status,
              createdAt: post.createdAt.toISOString(),
              updatedAt: post.updatedAt.toISOString(),
            })),
          },
        };
      }),
    rename: baseProcedure
      .input(renamePostCollectionInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });
        await assertActiveSubscription(input.organizationId);

        const [updatedCollection] = await db
          .update(postCollections)
          .set({
            name: input.name,
            nameSource: "user",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(postCollections.id, input.collectionId),
              eq(postCollections.organizationId, input.organizationId)
            )
          )
          .returning();

        if (!updatedCollection) {
          throw notFound("Post collection not found");
        }

        return {
          collection: {
            id: updatedCollection.id,
            name: updatedCollection.name,
            nameSource: updatedCollection.nameSource,
          },
        };
      }),
    delete: baseProcedure
      .input(postCollectionInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existingCollection = await db.query.postCollections.findFirst({
          where: and(
            eq(postCollections.id, input.collectionId),
            eq(postCollections.organizationId, input.organizationId)
          ),
          columns: { id: true },
        });

        if (!existingCollection) {
          throw notFound("Post collection not found");
        }

        await db
          .delete(postCollections)
          .where(
            and(
              eq(postCollections.id, input.collectionId),
              eq(postCollections.organizationId, input.organizationId)
            )
          );

        return { success: true };
      }),
    updateExpectedPostCount: baseProcedure
      .input(updateExpectedPostCountInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });
        await assertActiveSubscription(input.organizationId);

        const [updatedCollection] = await db
          .update(postCollections)
          .set({
            expectedPostCount: input.expectedPostCount,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(postCollections.id, input.collectionId),
              eq(postCollections.organizationId, input.organizationId)
            )
          )
          .returning({ id: postCollections.id });

        if (!updatedCollection) {
          throw notFound("Post collection not found");
        }

        return { success: true };
      }),
  },
  metrics: {
    get: baseProcedure
      .input(contentOrganizationIdInputSchema)
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
    .input(contentOrganizationIdInputSchema.and(contentPreviewRequestSchema))
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
  createCollection: baseProcedure
    .input(createPostCollectionInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });
      await assertActiveSubscription(input.organizationId);

      const now = new Date();
      const collectionId = nanoid();

      await db.insert(postCollections).values({
        id: collectionId,
        organizationId: input.organizationId,
        source: "manual",
        sourceId: collectionId,
        name: buildPostCollectionName(input.contentTypes, now),
        nameSource: "generated",
        contentTypes: input.contentTypes,
        expectedPostCount: input.expectedPostCount,
        completedPostCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      return { collectionId };
    }),
  generate: baseProcedure
    .input(generateContentInputSchema)
    .handler(async ({ context, input }) => {
      const auth = await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });
      await assertActiveSubscription(input.organizationId);

      const collection = await db.query.postCollections.findFirst({
        where: and(
          eq(postCollections.id, input.collectionId),
          eq(postCollections.organizationId, input.organizationId)
        ),
      });

      if (!collection) {
        throw notFound("Post collection not found");
      }

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

      let aiCreditChecked = false;
      let aiCreditMarkup = false;

      if (autumn) {
        let data: CheckResponse | null = null;

        try {
          data = await autumn.check({
            customerId: input.organizationId,
            featureId: FEATURES.AI_CREDITS,
            requiredBalance: 1,
          });
        } catch {
          throw internalServerError("Failed to verify AI credits");
        }

        if (!data?.allowed) {
          throw paymentRequired("AI credit limit reached");
        }

        aiCreditChecked = true;
        aiCreditMarkup = shouldApplyMarkup(data?.balance ?? null);
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
        const requestedLinearIds = new Set(
          input.linearIntegrationIds ?? input.integrations?.linear ?? []
        );

        linearIntegrationIds = linearIntegrations
          .filter(
            (integration) =>
              integration.enabled &&
              (requestedLinearIds.size === 0 ||
                requestedLinearIds.has(integration.id))
          )
          .map((integration) => integration.id);
      }

      await triggerOnDemandContent({
        organizationId: input.organizationId,
        userId: auth.user.id,
        collectionId: input.collectionId,
        runId,
        contentType: input.contentType,
        lookbackWindow: input.lookbackWindow,
        repositoryIds: input.repositoryIds ?? input.integrations?.github,
        linearIntegrationIds,
        brandVoiceId: input.brandIdentityId ?? input.brandVoiceId,
        dataPoints: input.dataPoints,
        selectedItems: input.selectedItems,
        aiCreditReserved: aiCreditChecked,
        aiCreditMarkup,
        source: "dashboard",
      });

      return {
        success: true,
        runId,
      };
    }),
  activeGenerations: {
    list: baseProcedure
      .input(contentOrganizationIdInputSchema)
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
      .input(
        contentOrganizationIdInputSchema.and(clearCompletedGenerationSchema)
      )
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });
        await assertActiveSubscription(input.organizationId);

        await clearCompletedGeneration(input.organizationId, input.runId);

        return { success: true };
      }),
  },
};
