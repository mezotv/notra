import { ContentGenerationSkippedError } from "@notra/ai/agents/background-gen";
import { generateBlogPost } from "@notra/ai/agents/blog-post";
import { isGitHubRateLimitError } from "@notra/ai/tools/github";
import type {
  ContentGenerationContext,
  ContentGenerationResult,
} from "../types";

export async function handleBlogPost(
  ctx: ContentGenerationContext
): Promise<ContentGenerationResult> {
  try {
    const { postId, title, posts, usage } = await generateBlogPost({
      organizationId: ctx.organizationId,
      voiceId: ctx.voiceId,
      repositories: ctx.repositories,
      linearIntegrations: ctx.linearIntegrations,
      tone: ctx.tone,
      promptInput: ctx.promptInput,
      sourceMetadata: ctx.sourceMetadata,
      dataPointSettings: ctx.dataPointSettings,
      selectionFilters: ctx.selectionFilters,
      commitWindow: ctx.commitWindow,
      autoPublish: ctx.autoPublish,
      resolveContext: ctx.resolveContext,
      resolveLinearContext: ctx.resolveLinearContext,
      log: ctx.log,
      telemetryMetadata: ctx.telemetryMetadata,
    });

    return { status: "ok", postId, title, posts, usage };
  } catch (error) {
    if (error instanceof ContentGenerationSkippedError) {
      return {
        status: "skipped",
        reason: error.message,
      };
    }

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
