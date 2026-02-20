import { db } from "@notra/db/drizzle";
import { and, eq } from "@notra/db/operators";
import { posts } from "@notra/db/schema";
import type { UnkeyContext } from "@unkey/hono";
import { Hono } from "hono";
import {
  getPostParamsSchema,
  getPostsParamsSchema,
  getPostsQuerySchema,
} from "@/schemas/post";
import { getExternalOrganizationId, hasApiReadPermission } from "@/utils/unkey";

export const contentRoutes = new Hono<{ Variables: { unkey: UnkeyContext } }>();

contentRoutes.use("*", async (c, next) => {
  const keyInfo = c.get("unkey");

  if (!hasApiReadPermission(keyInfo)) {
    return c.json({ error: "Forbidden: missing api.read permission" }, 403);
  }

  await next();
});

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

  const queryValidation = getPostsQuerySchema.safeParse(c.req.query());
  if (!queryValidation.success) {
    return c.json(
      { error: queryValidation.error.issues[0]?.message ?? "Invalid query" },
      400
    );
  }

  const keyInfo = c.get("unkey");
  const keyOrganizationId = getExternalOrganizationId(keyInfo);
  if (
    !keyOrganizationId ||
    keyOrganizationId !== paramsValidation.data.organizationId
  ) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const results = await db.query.posts.findMany({
    where: eq(posts.organizationId, paramsValidation.data.organizationId),
    orderBy: (table, { asc, desc }) =>
      queryValidation.data.sort === "asc"
        ? [asc(table.createdAt), asc(table.id)]
        : [desc(table.createdAt), desc(table.id)],
    columns: {
      id: true,
      title: true,
      content: true,
      markdown: true,
      contentType: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json({
    posts: results,
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

  const keyInfo = c.get("unkey");
  const keyOrganizationId = getExternalOrganizationId(keyInfo);
  if (
    !keyOrganizationId ||
    keyOrganizationId !== paramsValidation.data.organizationId
  ) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const post = await db.query.posts.findFirst({
    where: and(
      eq(posts.id, paramsValidation.data.postId),
      eq(posts.organizationId, paramsValidation.data.organizationId)
    ),
    columns: {
      id: true,
      title: true,
      content: true,
      markdown: true,
      contentType: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json({ post });
});
