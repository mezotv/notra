import { maybeGenerateCollectionTitle } from "@notra/ai/jobs/collection-title";
import type {
  CreatePostRecordParams,
  CreatePostRecordResult,
  EnsureChatPostCollectionParams,
  UpdatePostRecordParams,
  UpdatePostRecordResult,
} from "@notra/ai/types/post-service";
import { sanitizeMarkdownHtml } from "@notra/ai/utils/sanitize";
import { db } from "@notra/db/drizzle";
import { postCollections, posts } from "@notra/db/schema";
import { buildPostCollectionName } from "@notra/db/utils/post-collections";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { marked } from "marked";
import { customAlphabet } from "nanoid";

const generatePostId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  16
);

export async function createPostRecord(
  params: CreatePostRecordParams
): Promise<CreatePostRecordResult> {
  const id = params.postId ?? generatePostId();
  const content = sanitizeMarkdownHtml(await marked.parse(params.markdown));

  const deduplicated = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(posts)
      .values({
        id,
        organizationId: params.organizationId,
        collectionId: params.collectionId,
        title: params.title,
        slug: params.slug ?? null,
        content,
        markdown: params.markdown,
        recommendations: params.recommendations ?? null,
        contentType: params.contentType,
        contentSubtype: params.contentSubtype ?? null,
        status: params.autoPublish ? "published" : "draft",
        sourceMetadata: params.sourceMetadata ?? null,
      })
      .onConflictDoNothing({ target: posts.id })
      .returning({ id: posts.id });

    if (inserted.length === 0) {
      return true;
    }

    await tx
      .update(postCollections)
      .set({
        completedPostCount: sql`${postCollections.completedPostCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(postCollections.id, params.collectionId),
          eq(postCollections.organizationId, params.organizationId)
        )
      );
    return false;
  });

  if (!deduplicated) {
    await maybeGenerateCollectionTitle({
      collectionId: params.collectionId,
      organizationId: params.organizationId,
    });
  }

  return { postId: id, deduplicated };
}

export async function updatePostRecord(
  params: UpdatePostRecordParams
): Promise<UpdatePostRecordResult> {
  const updates: Record<string, string | null> = {};
  if (params.title !== undefined) {
    updates.title = params.title;
  }
  if (params.slug !== undefined) {
    updates.slug = params.slug;
  }
  if (params.markdown !== undefined) {
    updates.content = sanitizeMarkdownHtml(await marked.parse(params.markdown));
    updates.markdown = params.markdown;
  }
  if (params.recommendations !== undefined) {
    updates.recommendations = params.recommendations;
  }

  if (Object.keys(updates).length === 0) {
    return { status: "no_changes" };
  }

  const rows = await db
    .update(posts)
    .set(updates)
    .where(
      and(
        eq(posts.id, params.postId),
        eq(posts.organizationId, params.organizationId)
      )
    )
    .returning({ id: posts.id });

  return { status: rows.length === 0 ? "not_found" : "updated" };
}

export async function ensureChatPostCollection(
  params: EnsureChatPostCollectionParams
): Promise<string> {
  const now = new Date();
  const contentTypesJson = JSON.stringify([params.contentType]);

  const [collection] = await db
    .insert(postCollections)
    .values({
      id: generatePostId(),
      organizationId: params.organizationId,
      source: "chat",
      sourceId: params.chatId ?? null,
      name: buildPostCollectionName([params.contentType], now),
      nameSource: "generated",
      contentTypes: [params.contentType],
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
    .returning({ id: postCollections.id });

  if (!collection) {
    throw new Error("Failed to create the chat post collection");
  }

  return collection.id;
}
