import { contentTypeSchema } from "@notra/ai/schemas/content";
import { supportsPostSlug } from "@notra/ai/schemas/post";
import { sanitizeMarkdownHtml } from "@notra/ai/utils/sanitize";
import { db } from "@notra/db/drizzle";
import { postCollections, posts } from "@notra/db/schema";
import { buildPostCollectionName } from "@notra/db/utils/post-collections";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { marked } from "marked";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing.
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";

const createChatPostSchema = z.object({
  chatId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).nullable().optional(),
  markdown: z.string().trim().min(1),
  contentType: contentTypeSchema,
  status: z.enum(["draft", "published"]),
});

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { organizationId } = await params;

  await assertOrganizationAccess({
    headers: request.headers,
    organizationId,
  });

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
  const slug =
    supportsPostSlug(contentType) && parsed.data.slug ? parsed.data.slug : null;
  const content = sanitizeMarkdownHtml(await marked.parse(markdown));
  const id = nanoid();
  const collectionId = nanoid();
  const now = new Date();
  const contentTypesJson = JSON.stringify([contentType]);
  const [collection] = await db
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
    .returning({ id: postCollections.id });

  if (!collection) {
    return NextResponse.json(
      { error: "Failed to create chat collection" },
      { status: 500 }
    );
  }

  await db.insert(posts).values({
    id,
    organizationId,
    collectionId: collection.id,
    title,
    slug,
    content,
    markdown,
    contentType,
    status,
    sourceMetadata: null,
  });

  return NextResponse.json({ postId: id, status });
}
