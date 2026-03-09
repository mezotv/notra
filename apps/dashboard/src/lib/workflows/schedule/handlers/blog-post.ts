import { generateBlogPost } from "@/lib/ai/agents/blog-post";
import { isGitHubRateLimitError } from "@/lib/ai/tools/github";
import type {
  ContentGenerationContext,
  ContentGenerationResult,
} from "../types";

export async function handleBlogPost(
  ctx: ContentGenerationContext
): Promise<ContentGenerationResult> {
  try {
    const { postId, title, posts } = await generateBlogPost({
      organizationId: ctx.organizationId,
      repositories: ctx.repositories,
      tone: ctx.tone,
      promptInput: ctx.promptInput,
      sourceMetadata: ctx.sourceMetadata,
    });

    return { status: "ok", postId, title, posts };
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
