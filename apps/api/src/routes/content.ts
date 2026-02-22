import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { and, count, eq, inArray } from "@notra/db/operators";
import { posts } from "@notra/db/schema";
import {
  errorResponseSchema,
  getPostParamsSchema,
  getPostQuerySchema,
  getPostResponseSchema,
  getPostsOpenApiQuerySchema,
  getPostsParamsSchema,
  getPostsResponseSchema,
} from "../schemas/post";

export const contentRoutes = new OpenAPIHono();

const getPostsRoute = createRoute({
  method: "get",
  path: "/{organizationId}/posts",
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
  path: "/{organizationId}/posts/{postId}",
  tags: ["Content"],
  operationId: "getPost",
  summary: "Get a single post",
  request: {
    params: getPostParamsSchema,
    query: getPostQuerySchema,
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

contentRoutes.openapi(getPostsRoute, async (c) => {
  const params = c.req.valid("param");
  const query = c.req.valid("query");

  const auth = c.get("auth");
  const keyOrganizationId = auth.identity?.externalId;
  if (!keyOrganizationId || keyOrganizationId !== params.organizationId) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const db = c.get("db");
  const { limit, page, sort, status } = query;
  const offset = (page - 1) * limit;
  const whereClause = and(
    eq(posts.organizationId, params.organizationId),
    status.length === 2 ? undefined : inArray(posts.status, status)
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
      metadata: {
        status,
      },
    },
    200
  );
});

contentRoutes.openapi(getPostRoute, async (c) => {
  const params = c.req.valid("param");
  const query = c.req.valid("query");

  const auth = c.get("auth");
  const keyOrganizationId = auth.identity?.externalId;
  if (!keyOrganizationId || keyOrganizationId !== params.organizationId) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const db = c.get("db");
  const { status } = query;
  const post = await db.query.posts.findFirst({
    where: and(
      eq(posts.id, params.postId),
      eq(posts.organizationId, params.organizationId),
      status.length === 2 ? undefined : inArray(posts.status, status)
    ),
    columns: {
      id: true,
      title: true,
      content: true,
      markdown: true,
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
      metadata: {
        status,
      },
    },
    200
  );
});
