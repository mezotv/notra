import { generateRepoImage } from "@notra/ai/agents/repo-image";
import { isGitHubRateLimitError } from "@notra/ai/tools/github";
import {
  buildGeneratedImageHtmlPlaceholder,
  buildGeneratedImageMarkdown,
} from "@notra/ai/utils/html";
import { db } from "@notra/db/drizzle";
import { postCollections, posts } from "@notra/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  ContentGenerationContext,
  ContentGenerationResult,
} from "../types";

export async function handleImage(
  ctx: ContentGenerationContext
): Promise<ContentGenerationResult> {
  const repository = ctx.repositories[0];

  if (!(repository && ctx.userId)) {
    return {
      status: "generation_failed",
      reason: repository
        ? "User context is required to generate an image."
        : "At least one GitHub repository is required to generate an image.",
    };
  }

  try {
    const title = `Image for ${repository.owner}/${repository.repo}`;
    const result = await generateRepoImage({
      input: {
        organizationId: ctx.organizationId,
        integrationId: repository.integrationId,
        branch: repository.defaultBranch ?? "main",
        mode: "prompt",
        prompt: buildImagePrompt(ctx),
      },
      snapshotName: `image-${ctx.organizationId}-${Date.now()}`,
      userId: ctx.userId,
    });

    const postId = nanoid();
    await db.transaction(async (tx) => {
      await tx.insert(posts).values({
        id: postId,
        organizationId: ctx.organizationId,
        collectionId: ctx.collectionId,
        title,
        slug: null,
        content: buildGeneratedImageHtmlPlaceholder(title),
        markdown: buildGeneratedImageMarkdown({
          title,
          pngBase64: result.pngBase64,
        }),
        recommendations: null,
        contentType: "image",
        status: ctx.autoPublish ? "published" : "draft",
        sourceMetadata: {
          ...ctx.sourceMetadata,
          type: "generated_image",
          integrationId: repository.integrationId,
          branch: repository.defaultBranch ?? "main",
          mode: "prompt",
          sandbox: result.sandbox,
          usage: result.usage ?? null,
          artifacts: {
            html: result.html,
            svg: result.svg,
          },
        },
      });
      await tx
        .update(postCollections)
        .set({
          completedPostCount: sql`${postCollections.completedPostCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(postCollections.id, ctx.collectionId));
    });

    return {
      status: "ok",
      postId,
      title,
      posts: [{ postId, title, recommendations: null }],
      usage: result.usage,
    };
  } catch (error) {
    if (isGitHubRateLimitError(error)) {
      return {
        status: "rate_limited",
        retryAfterSeconds: error.retryAfterSeconds,
      };
    }

    return {
      status: "generation_failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildImagePrompt(ctx: ContentGenerationContext) {
  const promptParts = [
    `Create a polished 1200x630 social image for: ${ctx.promptInput.sourceTargets}.`,
    `Use repository activity from ${ctx.promptInput.lookbackLabel} (${ctx.promptInput.lookbackStartIso} to ${ctx.promptInput.lookbackEndIso}).`,
    ctx.promptInput.companyName
      ? `Company name: ${ctx.promptInput.companyName}.`
      : "",
    ctx.promptInput.companyDescription
      ? `Company description: ${ctx.promptInput.companyDescription}.`
      : "",
    ctx.promptInput.audience ? `Audience: ${ctx.promptInput.audience}.` : "",
    ctx.promptInput.customInstructions ?? "",
  ];

  return promptParts.filter(Boolean).join("\n");
}
