import { and, count, eq, inArray } from "@notra/db/operators";
import { posts } from "@notra/db/schema";
import { Hono } from "hono";
import {
  getPostParamsSchema,
  getPostQuerySchema,
  getPostsParamsSchema,
  getPostsQuerySchema,
} from "../schemas/post";

export const contentRoutes = new Hono();

contentRoutes.get("/:organizationId/posts", async (c) => {
  const paramsValidation = getPostsParamsSchema.safeParse(c.req.param());
  if (!paramsValidation.success) {
    return c.json(
      {
        error:
          paramsValidation.error.issues[0]?.message ?? "Invalid path params",
      },
      400
    );
  }

  const queryValidation = getPostsQuerySchema.safeParse({
    ...c.req.query(),
    status: new URL(c.req.url).searchParams.getAll("status"),
  });
  if (!queryValidation.success) {
    return c.json(
      { error: queryValidation.error.issues[0]?.message ?? "Invalid query" },
      400
    );
  }

  const auth = c.get("auth");
  const keyOrganizationId = auth.identity?.externalId;
  if (
    !keyOrganizationId ||
    keyOrganizationId !== paramsValidation.data.organizationId
  ) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const db = c.get("db");
  const { limit, page, sort, status } = queryValidation.data;
  const offset = (page - 1) * limit;
  const whereClause = and(
    eq(posts.organizationId, paramsValidation.data.organizationId),
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

  return c.json({
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
  });
});

contentRoutes.get("/:organizationId/posts/:postId", async (c) => {
  const paramsValidation = getPostParamsSchema.safeParse(c.req.param());
  if (!paramsValidation.success) {
    return c.json(
      {
        error:
          paramsValidation.error.issues[0]?.message ?? "Invalid path params",
      },
      400
    );
  }

  const auth = c.get("auth");
  const keyOrganizationId = auth.identity?.externalId;
  if (
    !keyOrganizationId ||
    keyOrganizationId !== paramsValidation.data.organizationId
  ) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const queryValidation = getPostQuerySchema.safeParse({
    status: new URL(c.req.url).searchParams.getAll("status"),
  });
  if (!queryValidation.success) {
    return c.json(
      { error: queryValidation.error.issues[0]?.message ?? "Invalid query" },
      400
    );
  }

  const db = c.get("db");
  const { status } = queryValidation.data;
  const post = await db.query.posts.findFirst({
    where: and(
      eq(posts.id, paramsValidation.data.postId),
      eq(posts.organizationId, paramsValidation.data.organizationId),
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

  return c.json({
    post,
    metadata: {
      status,
    },
  });
});
