import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { posts } from "@notra/db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import {
  ALL_POST_CONTENT_TYPES,
  ALL_POST_STATUSES,
  deletePostResponseSchema,
  errorResponseSchema,
  getPostParamsSchema,
  getPostResponseSchema,
  getPostsOpenApiQuerySchema,
  getPostsParamsSchema,
  getPostsResponseSchema,
} from "../schemas/content";
import { getOrganizationId } from "../utils/auth";
import {
  ORGANIZATION_POST_PATH_REGEX,
  ORGANIZATION_POSTS_PATH_REGEX,
} from "../utils/regex";

export const contentRoutes = new OpenAPIHono();

function shouldApplyFilter(
  selectedValues: readonly string[],
  allValues: readonly string[]
) {
  return selectedValues.length < allValues.length;
}

contentRoutes.get("/:organizationId/posts", async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const pathOrg = c.req.param("organizationId");
  if (orgId !== pathOrg) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const url = new URL(c.req.url);
  const canonicalPath = url.pathname.replace(
    ORGANIZATION_POSTS_PATH_REGEX,
    "/posts"
  );
  return c.redirect(`${canonicalPath}${url.search}`, 308);
});

contentRoutes.get("/:organizationId/posts/:postId", async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const pathOrg = c.req.param("organizationId");
  const postId = c.req.param("postId");
  if (orgId !== pathOrg) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const url = new URL(c.req.url);
  const canonicalPath = url.pathname.replace(
    ORGANIZATION_POST_PATH_REGEX,
    `/posts/${postId}`
  );
  return c.redirect(`${canonicalPath}${url.search}`, 308);
});

const getPostsRoute = createRoute({
  method: "get",
  path: "/posts",
  tags: ["Content"],
  operationId: "listPosts",
  summary: "List posts",
  request: {
    params: getPostsParamsSchema,
    query: getPostsOpenApiQuerySchema,
  },
  responses: {
    200: {
      description: "Posts fetched successfully",
      content: {
        "application/json": {
          schema: getPostsResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params or query",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getPostRoute = createRoute({
  method: "get",
  path: "/posts/{postId}",
  tags: ["Content"],
  operationId: "getPost",
  summary: "Get a single post",
  request: {
    params: getPostParamsSchema,
  },
  responses: {
    200: {
      description: "Post fetched successfully",
      content: {
        "application/json": {
          schema: getPostResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const deletePostRoute = createRoute({
  method: "delete",
  path: "/posts/{postId}",
  tags: ["Content"],
  operationId: "deletePost",
  summary: "Delete a single post",
  request: {
    params: getPostParamsSchema,
  },
  responses: {
    200: {
      description: "Post deleted successfully",
      content: {
        "application/json": {
          schema: deletePostResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Post not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

contentRoutes.openapi(getPostsRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const query = c.req.valid("query");
  const db = c.get("db");
  const { limit, page, sort, status, contentType } = query;
  const offset = (page - 1) * limit;
  const whereClause = and(
    eq(posts.organizationId, orgId),
    shouldApplyFilter(status, ALL_POST_STATUSES)
      ? inArray(posts.status, status)
      : undefined,
    shouldApplyFilter(contentType, ALL_POST_CONTENT_TYPES)
      ? inArray(posts.contentType, contentType)
      : undefined
  );

  const [countResult] = await db
    .select({ totalItems: count(posts.id) })
    .from(posts)
    .where(whereClause);

  const totalItems = countResult?.totalItems ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  const results = await db.query.posts.findMany({
    where: whereClause,
    orderBy: (table, { asc, desc }) =>
      sort === "asc"
        ? [asc(table.createdAt), asc(table.id)]
        : [desc(table.createdAt), desc(table.id)],
    limit,
    offset,
    columns: {
      id: true,
      title: true,
      content: true,
      markdown: true,
      recommendations: true,
      contentType: true,
      sourceMetadata: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json(
    {
      posts: results,
      pagination: {
        limit,
        currentPage: page,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
        totalPages,
        totalItems,
      },
    },
    200
  );
});

contentRoutes.openapi(getPostRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const params = c.req.valid("param");
  const db = c.get("db");
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, params.postId), eq(posts.organizationId, orgId)),
    columns: {
      id: true,
      title: true,
      content: true,
      markdown: true,
      recommendations: true,
      contentType: true,
      sourceMetadata: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json(
    {
      post: post ?? null,
    },
    200
  );
});

contentRoutes.openapi(deletePostRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const { postId } = c.req.valid("param");
  const db = c.get("db");
  const [deletedPost] = await db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.organizationId, orgId)))
    .returning({ id: posts.id });

  if (!deletedPost) {
    return c.json({ error: "Post not found" }, 404);
  }

  return c.json({ id: deletedPost.id }, 200);
});
