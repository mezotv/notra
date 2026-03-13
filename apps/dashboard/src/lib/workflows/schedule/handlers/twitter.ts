import { generateTwitterPost } from "@/lib/ai/agents/twitter";
import { isGitHubRateLimitError } from "@/lib/ai/tools/github";
import type {
  ContentGenerationContext,
  ContentGenerationResult,
} from "../types";

export async function handleTwitter(
  ctx: ContentGenerationContext
): Promise<ContentGenerationResult> {
  try {
    const { postId, title, posts } = await generateTwitterPost({
      organizationId: ctx.organizationId,
      voiceId: ctx.voiceId,
      repositories: ctx.repositories,
      tone: ctx.tone,
      promptInput: ctx.promptInput,
      sourceMetadata: ctx.sourceMetadata,
      dataPointSettings: ctx.dataPointSettings,
      selectionFilters: ctx.selectionFilters,
      commitWindow: ctx.commitWindow,
      autoPublish: ctx.autoPublish,
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
