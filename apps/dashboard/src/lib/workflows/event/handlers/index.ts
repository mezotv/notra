import { generateBlogPost } from "@/lib/ai/agents/blog-post";
import { generateChangelog } from "@/lib/ai/agents/changelog";
import { generateLinkedInPost } from "@/lib/ai/agents/linkedin";
import { generateTwitterPost } from "@/lib/ai/agents/twitter";
import type {
  EventGenerationContext,
  EventGenerationResult,
} from "@/types/workflows/workflows";
import { buildEventPromptInput } from "../prompt-input";

export async function generateEventBasedContent(
  ctx: EventGenerationContext
): Promise<EventGenerationResult> {
  const { outputType } = ctx;

  const generateFnMap: Record<string, typeof generateChangelog> = {
    changelog: generateChangelog,
    blog_post: generateBlogPost,
    twitter_post: generateTwitterPost,
    linkedin_post: generateLinkedInPost,
  };

  const generateFn = generateFnMap[outputType];
  if (!generateFn) {
    return {
      status: "unsupported_output_type",
      outputType,
    };
  }

  try {
    const repositories = [
      {
        integrationId: ctx.repositoryId,
        owner: ctx.repositoryOwner,
        repo: ctx.repositoryName,
        defaultBranch: null,
      },
    ];

    const promptInput = buildEventPromptInput(ctx);

    const agentOptions = {
      organizationId: ctx.organizationId,
      repositories,
      tone: ctx.tone,
      promptInput,
      sourceMetadata: ctx.sourceMetadata,
    };

    const result = await generateFn(agentOptions);

    return {
      status: "ok",
      postId: result.postId,
      title: result.title,
      posts: result.posts,
    };
  } catch (error) {
    return {
      status: "generation_failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
