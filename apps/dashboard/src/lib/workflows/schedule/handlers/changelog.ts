import { generateChangelog } from "@notra/ai/agents/changelog";
import { isGitHubRateLimitError } from "@notra/ai/tools/github";
import type {
  ContentGenerationContext,
  ContentGenerationResult,
} from "../types";

export async function handleChangelog(
  ctx: ContentGenerationContext
): Promise<ContentGenerationResult> {
  try {
    const { postId, title, posts } = await generateChangelog({
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
