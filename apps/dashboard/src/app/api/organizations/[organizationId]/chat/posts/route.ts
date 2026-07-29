import { maybeGenerateCollectionTitle } from "@notra/ai/jobs/collection-title";
import { supportsPostSlug } from "@notra/ai/schemas/post";
import { sanitizeMarkdownHtml } from "@notra/ai/utils/sanitize";
import { db } from "@notra/db/drizzle";
import { postCollections, posts } from "@notra/db/schema";
import {
  buildPostCollectionName,
  isLegacyPostCollectionName,
} from "@notra/db/utils/post-collections";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { Effect } from "effect";
import { marked } from "marked";
import { nanoid } from "nanoid";
import { after, NextResponse } from "next/server";
import { withOrganizationScopes } from "@/lib/permissions/assert";
import { resolveMemberRoleIds } from "@/lib/permissions/resolve-scopes";
import { findApplicableWorkflow } from "@/lib/reviews/workflow";
import { createChatPostSchema } from "@/schemas/content";
import type { RouteContext } from "@/types/api/routes";

export async function POST(
  request: Request,
  { params }: RouteContext<{ organizationId: string }>
) {
  const { organizationId } = await params;

  const auth = await withOrganizationScopes(request, organizationId, {
    scopes: ["posts:create"],
  });

  if (!auth.success) {
    return auth.response;
  }

  const parsed = createChatPostSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid post payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { chatId, title, contentType, markdown, status } = parsed.data;

  if (status === "published") {
    const { scopes, membership } = auth.context;
    const canPublishDirectly = scopes.includes("posts:publish_override");

    if (!canPublishDirectly) {
      if (!scopes.includes("posts:publish")) {
        return NextResponse.json(
          { error: "You do not have permission to publish posts" },
          { status: 403 }
        );
      }

      const workflowCheck = await Effect.runPromise(
        Effect.gen(function* () {
          const roleIds = yield* resolveMemberRoleIds({
            memberId: membership.id,
          });
          return yield* findApplicableWorkflow({
            organizationId,
            authorRoleIds: roleIds,
          });
        }).pipe(
          Effect.match({
            onFailure: () => ({ failed: true as const, workflow: null }),
            onSuccess: (workflow) => ({ failed: false as const, workflow }),
          })
        )
      );

      if (workflowCheck.failed) {
        return NextResponse.json(
          { error: "Failed to resolve publishing requirements" },
          { status: 500 }
        );
      }

      if (workflowCheck.workflow) {
        return NextResponse.json(
          {
            error: `Posts you create must be approved through the "${workflowCheck.workflow.name}" workflow before publishing. Save it as a draft and submit it for review.`,
          },
          { status: 403 }
        );
      }
    }
  }
  const slug =
    supportsPostSlug(contentType) && parsed.data.slug ? parsed.data.slug : null;
  const content = sanitizeMarkdownHtml(await marked.parse(markdown));
  const id = nanoid();
  const collectionId = nanoid();
  const now = new Date();
  const contentTypesJson = JSON.stringify([contentType]);
  const result = await db.transaction(async (tx) => {
    const [collection] = await tx
      .insert(postCollections)
      .values({
        id: collectionId,
        organizationId,
        source: "chat",
        sourceId: chatId,
        name: buildPostCollectionName([contentType], now),
        nameSource: "generated",
        contentTypes: [contentType],
        expectedPostCount: null,
        completedPostCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          postCollections.organizationId,
          postCollections.source,
          postCollections.sourceId,
        ],
        targetWhere: and(
          eq(postCollections.source, "chat"),
          isNotNull(postCollections.sourceId)
        ),
        set: {
          contentTypes: sql`CASE
            WHEN ${postCollections.contentTypes} @> ${contentTypesJson}::jsonb
              THEN ${postCollections.contentTypes}
            ELSE ${postCollections.contentTypes} || ${contentTypesJson}::jsonb
          END`,
          updatedAt: now,
        },
      })
      .returning({
        id: postCollections.id,
        contentTypes: postCollections.contentTypes,
        createdAt: postCollections.createdAt,
        name: postCollections.name,
        nameSource: postCollections.nameSource,
      });

    if (!collection) {
      return null;
    }

    if (
      collection.nameSource === "generated" &&
      isLegacyPostCollectionName(collection.name)
    ) {
      await tx
        .update(postCollections)
        .set({
          name: buildPostCollectionName(
            Array.isArray(collection.contentTypes)
              ? collection.contentTypes
              : [contentType],
            collection.createdAt
          ),
          updatedAt: now,
        })
        .where(eq(postCollections.id, collection.id));
    }

    await tx.insert(posts).values({
      id,
      organizationId,
      collectionId: collection.id,
      title,
      slug,
      content,
      markdown,
      contentType,
      status,
      createdBy: auth.context.user.id,
      ...(status === "published"
        ? { publishedAt: now, publishedBy: auth.context.user.id }
        : {}),
      sourceMetadata: null,
    });

    return { postId: id, collectionId: collection.id };
  });

  if (!result) {
    return NextResponse.json(
      { error: "Failed to create chat collection" },
      { status: 500 }
    );
  }

  after(async () => {
    await maybeGenerateCollectionTitle({
      collectionId: result.collectionId,
      organizationId,
    });
  });

  return NextResponse.json({ postId: result.postId, status });
}
