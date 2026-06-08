import {
  deleteRepoImageSnapshot,
  generateRepoImage,
  RepoImageError,
} from "@notra/ai/agents/repo-image";
import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { calculateTokenCostCents } from "@notra/ai/billing/token-pricing";
import { IMAGE_GEN_MODEL_ID } from "@notra/ai/constants/repo-image";
import {
  imageRevisionToolInputSchema,
  imageToolInputSchema,
} from "@notra/ai/schemas/repo-image";
import type {
  ImageRevisionToolConfig,
  ImageToolConfig,
} from "@notra/ai/types/repo-image";
import { toolDescription } from "@notra/ai/utils/description";
import {
  uploadGeneratedHtmlAsset,
  uploadGeneratedImageAsset,
} from "@notra/ai/utils/image-assets";
import { db } from "@notra/db/drizzle";
import { postCollections, posts } from "@notra/db/schema";
import { buildPostCollectionName } from "@notra/db/utils/post-collections";
import { type Tool, tool } from "ai";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export function createImageTool(config: ImageToolConfig): Tool {
  return tool({
    description: toolDescription({
      toolName: "createImage",
      intro:
        "Generates a 1200x630 marketing asset from a connected GitHub repository in a sandbox, saves the image as content, and snapshots the sandbox for later follow-up work.",
      whenToUse:
        "When the user asks to create, generate, revise, or continue a marketing image, visual, or social card from repository context.",
      usageNotes:
        "Requires integrationId and branch. For revisions, pass sourcePostId when the user refers to a prior generated image so the sandbox can be restored from its snapshot.",
    }),
    inputSchema: imageToolInputSchema,
    execute: async ({ sourcePostId, title, ...input }) => {
      const restoreSnapshot = sourcePostId
        ? await getImageSnapshot(config.organizationId, sourcePostId)
        : null;
      const brandIdentityId =
        input.brandIdentityId ?? restoreSnapshot?.brandIdentityId;

      const result = await generateRepoImage({
        input: {
          organizationId: config.organizationId,
          integrationId: input.integrationId,
          branch: input.branch,
          brandIdentityId,
          mode: input.mode,
          prompt: input.prompt,
          prNumber: input.prNumber,
          commitSha: input.commitSha,
        },
        restoreSnapshotId: restoreSnapshot?.snapshotId,
        snapshotName: `image-${config.organizationId}-${Date.now()}`,
        userId: config.userId,
      });

      const postId = await saveGeneratedImagePost({
        chatId: config.chatId,
        organizationId: config.organizationId,
        title,
        pngBase64: result.pngBase64,
        html: result.html,
        sourceMetadata: {
          type: "generated_image",
          chatId: config.chatId ?? null,
          integrationId: input.integrationId,
          branch: input.branch,
          brandIdentityId: result.brandIdentityId ?? brandIdentityId ?? null,
          mode: input.mode,
          prompt: input.prompt ?? null,
          prNumber: input.prNumber ?? null,
          commitSha: input.commitSha ?? null,
          sourcePostId: sourcePostId ?? null,
          sandbox: result.sandbox,
          usage: result.usage ?? null,
        },
      });

      await trackImageGenerationUsage({
        organizationId: config.organizationId,
        postId,
        usage: result.usage,
        useMarkup: config.useMarkup,
      });

      return {
        postId,
        title,
        status: "created",
        contentType: "image",
        sandbox: result.sandbox,
        usage: result.usage ?? null,
      };
    },
  });
}

export function createImageRevisionTool(config: ImageRevisionToolConfig): Tool {
  return tool({
    description: toolDescription({
      toolName: "reviseImage",
      intro:
        "Revises the current generated marketing asset by restoring its saved sandbox snapshot, applying the requested visual change, rendering a new 1200x630 PNG, saving it back to this image content item, and snapshotting the sandbox again.",
      whenToUse:
        "When editing or revising the current image content item. Use this instead of markdown editing.",
      usageNotes:
        "Describe the requested visual change in prompt. The current image post ID, repository integration, branch, and sandbox snapshot are supplied automatically.",
    }),
    inputSchema: imageRevisionToolInputSchema,
    execute: async ({ prompt, title }) => {
      const previousSnapshot = await getImageSnapshot(
        config.organizationId,
        config.postId
      );
      const nextTitle = title ?? config.title;

      const result = await generateRepoImage({
        input: {
          organizationId: config.organizationId,
          integrationId: config.integrationId,
          branch: config.branch,
          brandIdentityId: config.brandIdentityId,
          mode: "prompt",
          prompt,
        },
        restoreSnapshotId: previousSnapshot.snapshotId,
        snapshotName: `image-${config.organizationId}-${Date.now()}`,
        userId: config.userId,
      });

      const imageUrl = await uploadGeneratedImageAsset({
        organizationId: config.organizationId,
        pngBase64: result.pngBase64,
        postId: config.postId,
      });
      const htmlUrl = await uploadGeneratedHtmlAsset({
        organizationId: config.organizationId,
        html: result.html,
        postId: config.postId,
      });
      const sourceMetadata = await buildRevisionSourceMetadata({
        organizationId: config.organizationId,
        postId: config.postId,
        integrationId: config.integrationId,
        branch: config.branch,
        prompt,
        result,
      });

      await db
        .update(posts)
        .set({
          title: nextTitle,
          content: imageUrl,
          htmlUrl,
          markdown: null,
          sourceMetadata,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(posts.id, config.postId),
            eq(posts.organizationId, config.organizationId)
          )
        );

      await deleteRepoImageSnapshot(previousSnapshot).catch((error) => {
        console.error("[repo-image] Failed to delete previous snapshot", {
          postId: config.postId,
          snapshotId: previousSnapshot.snapshotId,
          error,
        });
      });

      await trackImageGenerationUsage({
        organizationId: config.organizationId,
        postId: config.postId,
        usage: result.usage,
        useMarkup: config.useMarkup,
      });

      return {
        postId: config.postId,
        title: nextTitle,
        status: "updated",
        contentType: "image",
        sandbox: result.sandbox,
        usage: result.usage ?? null,
      };
    },
  });
}

async function buildRevisionSourceMetadata(params: {
  organizationId: string;
  postId: string;
  integrationId: string;
  branch: string;
  prompt: string;
  result: Awaited<ReturnType<typeof generateRepoImage>>;
}) {
  const post = await db.query.posts.findFirst({
    where: and(
      eq(posts.id, params.postId),
      eq(posts.organizationId, params.organizationId)
    ),
  });
  const existing =
    post?.sourceMetadata &&
    typeof post.sourceMetadata === "object" &&
    !Array.isArray(post.sourceMetadata)
      ? post.sourceMetadata
      : {};

  return {
    ...existing,
    type: "generated_image",
    integrationId: params.integrationId,
    branch: params.branch,
    brandIdentityId:
      params.result.brandIdentityId ?? getStoredBrandIdentityId(existing),
    mode: "prompt",
    prompt: params.prompt,
    sourcePostId: params.postId,
    sandbox: params.result.sandbox,
    usage: params.result.usage ?? null,
  };
}

async function trackImageGenerationUsage(params: {
  organizationId: string;
  postId: string;
  usage: Awaited<ReturnType<typeof generateRepoImage>>["usage"];
  useMarkup?: boolean;
}) {
  if (!autumn || !params.usage) {
    return;
  }

  const costCents = calculateTokenCostCents(
    params.usage,
    params.usage.modelId ?? IMAGE_GEN_MODEL_ID,
    params.useMarkup ?? false
  );
  const reportedCostCents =
    typeof params.usage.totalUsd === "number"
      ? Math.ceil(params.usage.totalUsd * 100)
      : undefined;

  console.info("[Autumn] Marketing asset usage cost comparison", {
    organizationId: params.organizationId,
    postId: params.postId,
    model: params.usage.modelId ?? IMAGE_GEN_MODEL_ID,
    billingBasis: "tokens",
    computedCostCents: costCents,
    reportedCostCents,
    reportedTotalUsd: params.usage.totalUsd,
    inputTokens: params.usage.inputTokens,
    outputTokens: params.usage.outputTokens,
    cacheReadTokens: params.usage.cacheReadTokens,
    cacheWriteTokens: params.usage.cacheWriteTokens,
    totalTokens: params.usage.totalTokens,
    markupApplied: params.useMarkup ?? false,
  });

  try {
    await autumn.track({
      customerId: params.organizationId,
      featureId: FEATURES.AI_CREDITS,
      value: costCents,
      properties: {
        source: "marketing_assets",
        post_id: params.postId,
        model: params.usage.modelId ?? IMAGE_GEN_MODEL_ID,
        billing_basis: "tokens",
        input_tokens: params.usage.inputTokens,
        output_tokens: params.usage.outputTokens,
        cache_read_tokens: params.usage.cacheReadTokens,
        cache_write_tokens: params.usage.cacheWriteTokens,
        total_tokens: params.usage.totalTokens,
        sandbox_total_usd: params.usage.totalUsd,
        markup_applied: params.useMarkup ?? false,
        cost_cents: costCents,
      },
    });
  } catch (error) {
    console.error("[Autumn] Track error after marketing asset generation:", {
      customerId: params.organizationId,
      postId: params.postId,
      error,
    });
  }
}

async function getImageSnapshot(organizationId: string, postId: string) {
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.organizationId, organizationId)),
  });

  if (!post) {
    throw new RepoImageError("not_found", "Source image post not found");
  }

  const metadata = post.sourceMetadata;
  if (
    !metadata ||
    typeof metadata !== "object" ||
    !("sandbox" in metadata) ||
    typeof metadata.sandbox !== "object" ||
    metadata.sandbox === null ||
    !("snapshotId" in metadata.sandbox) ||
    typeof metadata.sandbox.snapshotId !== "string"
  ) {
    throw new RepoImageError(
      "invalid_source",
      "Source image post does not have a sandbox snapshot"
    );
  }

  const boxId =
    "boxId" in metadata.sandbox && typeof metadata.sandbox.boxId === "string"
      ? metadata.sandbox.boxId
      : undefined;
  const brandIdentityId = getStoredBrandIdentityId(metadata) ?? undefined;

  return { boxId, snapshotId: metadata.sandbox.snapshotId, brandIdentityId };
}

function getStoredBrandIdentityId(metadata: object) {
  if (
    "brandIdentityId" in metadata &&
    typeof metadata.brandIdentityId === "string"
  ) {
    return metadata.brandIdentityId;
  }

  if ("brandVoiceId" in metadata && typeof metadata.brandVoiceId === "string") {
    return metadata.brandVoiceId;
  }

  return null;
}

async function saveGeneratedImagePost(params: {
  chatId?: string;
  organizationId: string;
  title: string;
  pngBase64: string;
  html: string;
  sourceMetadata: Record<string, unknown>;
}) {
  const postId = nanoid();
  const imageUrl = await uploadGeneratedImageAsset({
    organizationId: params.organizationId,
    pngBase64: params.pngBase64,
    postId,
  });
  const htmlUrl = await uploadGeneratedHtmlAsset({
    organizationId: params.organizationId,
    html: params.html,
    postId,
  });
  const collectionId = nanoid();
  const now = new Date();
  const contentTypesJson = JSON.stringify(["image"]);

  const [collection] = await db
    .insert(postCollections)
    .values({
      id: collectionId,
      organizationId: params.organizationId,
      source: "chat",
      sourceId: params.chatId ?? null,
      name: buildPostCollectionName(["image"], now),
      nameSource: "generated",
      contentTypes: ["image"],
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
    throw new Error("Failed to create image content collection");
  }

  await db.insert(posts).values({
    id: postId,
    organizationId: params.organizationId,
    collectionId: collection.id,
    title: params.title,
    slug: null,
    content: imageUrl,
    htmlUrl,
    markdown: null,
    recommendations: null,
    contentType: "image",
    status: "draft",
    sourceMetadata: params.sourceMetadata,
  });

  return postId;
}
