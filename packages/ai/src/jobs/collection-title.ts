import {
  COLLECTION_TITLE_EXCERPT_LENGTH,
  COLLECTION_TITLE_MAX_POSTS,
  COLLECTION_TITLE_MODEL_ID,
} from "@notra/ai/constants/collection-title";
import { gateway } from "@notra/ai/gateway";
import { withGatewayAutomaticCaching } from "@notra/ai/provider-options";
import {
  COLLECTION_TITLE_MAX_LENGTH,
  collectionTitleResultSchema,
} from "@notra/ai/schemas/collection-title";
import type {
  GenerateCollectionTitleParams,
  MaybeGenerateCollectionTitleParams,
} from "@notra/ai/types/collection-title";
import { buildExperimentalTelemetry } from "@notra/ai/utils/tcc";
import { db } from "@notra/db/drizzle";
import { postCollections, posts } from "@notra/db/schema";
import { generateObject } from "ai";
import { and, asc, eq, ne } from "drizzle-orm";

const HTML_TAG_REGEX = /<[^>]+>/g;
const WHITESPACE_REGEX = /\s+/g;

const SYSTEM_PROMPT = [
  "You write display titles for batches of AI-generated content shown in the Notra dashboard.",
  "Read the posts in the batch and produce one short title that captures what the batch is actually about.",
  `Requirements: at most ${COLLECTION_TITLE_MAX_LENGTH} characters, plain text, sentence case, no dates, no surrounding quotes, no trailing punctuation.`,
  'Do not use generic labels like "Changelog", "Blog post", or "LinkedIn post" as the title.',
  "Focus on the concrete subject matter: the features, fixes, announcements, or themes the posts cover.",
].join(" ");

function buildPostExcerpt(markdown: string | null, content: string) {
  const source = markdown ?? content.replace(HTML_TAG_REGEX, " ");
  return source
    .replace(WHITESPACE_REGEX, " ")
    .trim()
    .slice(0, COLLECTION_TITLE_EXCERPT_LENGTH);
}

export async function generateCollectionTitle(
  params: GenerateCollectionTitleParams
): Promise<string | null> {
  const collectionPosts = await db
    .select({
      title: posts.title,
      contentType: posts.contentType,
      markdown: posts.markdown,
      content: posts.content,
    })
    .from(posts)
    .where(
      and(
        eq(posts.collectionId, params.collectionId),
        eq(posts.organizationId, params.organizationId)
      )
    )
    .orderBy(asc(posts.createdAt))
    .limit(COLLECTION_TITLE_MAX_POSTS);

  if (collectionPosts.length === 0) {
    return null;
  }

  const postSummaries = collectionPosts.map((post, index) => {
    const label = post.contentType.replaceAll("_", " ");
    const excerpt = buildPostExcerpt(post.markdown, post.content);
    return [`Post ${index + 1} (${label}): ${post.title}`, excerpt]
      .filter(Boolean)
      .join("\n");
  });

  const { object } = await generateObject({
    model: gateway(COLLECTION_TITLE_MODEL_ID),
    schema: collectionTitleResultSchema,
    system: SYSTEM_PROMPT,
    prompt: postSummaries.join("\n\n"),
    providerOptions: withGatewayAutomaticCaching(undefined, {
      modelId: COLLECTION_TITLE_MODEL_ID,
    }),
    experimental_telemetry: buildExperimentalTelemetry({
      feature: "collection_title",
      organizationId: params.organizationId,
      collectionId: params.collectionId,
    }),
  });

  const title = object.title.trim();
  if (!title) {
    return null;
  }

  if (!params.dryRun) {
    await db
      .update(postCollections)
      .set({
        name: title,
        nameSource: params.nameSource ?? "generated",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(postCollections.id, params.collectionId),
          eq(postCollections.organizationId, params.organizationId),
          ne(postCollections.nameSource, "user")
        )
      );
  }

  return title;
}

export async function maybeGenerateCollectionTitle(
  params: MaybeGenerateCollectionTitleParams
) {
  try {
    const collection = await db.query.postCollections.findFirst({
      columns: {
        nameSource: true,
        expectedPostCount: true,
        completedPostCount: true,
      },
      where: and(
        eq(postCollections.id, params.collectionId),
        eq(postCollections.organizationId, params.organizationId)
      ),
    });

    if (!collection || collection.nameSource === "user") {
      return;
    }

    const isComplete =
      collection.expectedPostCount === null ||
      collection.completedPostCount >= collection.expectedPostCount;
    if (!isComplete) {
      return;
    }

    await generateCollectionTitle({
      collectionId: params.collectionId,
      organizationId: params.organizationId,
      nameSource: collection.nameSource,
    });
  } catch (error) {
    console.error("[CollectionTitle] Failed to generate collection title", {
      collectionId: params.collectionId,
      organizationId: params.organizationId,
      error,
    });
  }
}
