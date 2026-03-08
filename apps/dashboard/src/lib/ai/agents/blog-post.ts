import { withSupermemory } from "@supermemory/tools/ai-sdk";
import { stepCountIs, ToolLoopAgent } from "ai";
import { gateway } from "@/lib/ai/gateway";
import { getCasualBlogPostPrompt } from "@/lib/ai/prompts/blog_post/casual";
import { getConversationalBlogPostPrompt } from "@/lib/ai/prompts/blog_post/conversational";
import { getFormalBlogPostPrompt } from "@/lib/ai/prompts/blog_post/formal";
import { getProfessionalBlogPostPrompt } from "@/lib/ai/prompts/blog_post/professional";
import { getBlogPostUserPrompt } from "@/lib/ai/prompts/blog_post/user";
import {
  createGetCommitsByTimeframeTool,
  createGetPullRequestsTool,
  createGetReleaseByTagTool,
} from "@/lib/ai/tools/github";
import {
  createCreatePostTool,
  createFailTool,
  createUpdatePostTool,
  createViewPostTool,
  type PostToolsResult,
} from "@/lib/ai/tools/post";
import { getSkillByName, listAvailableSkills } from "@/lib/ai/tools/skills";
import { getValidToneProfile, type ToneProfile } from "@/schemas/brand";
import type {
  BlogPostAgentOptions,
  BlogPostAgentResult,
} from "@/types/ai/agents";

const blogPostPromptByTone: Record<ToneProfile, () => string> = {
  Conversational: getConversationalBlogPostPrompt,
  Professional: getProfessionalBlogPostPrompt,
  Casual: getCasualBlogPostPrompt,
  Formal: getFormalBlogPostPrompt,
};

export async function generateBlogPost(
  options: BlogPostAgentOptions
): Promise<BlogPostAgentResult> {
  const {
    organizationId,
    repositories,
    tone = "Conversational",
    promptInput,
    sourceMetadata,
  } = options;

  if (!repositories || repositories.length === 0) {
    throw new Error(
      "At least one repository must be provided to generate a blog post."
    );
  }

  const model = withSupermemory(
    gateway("anthropic/claude-haiku-4.5"),
    organizationId
  );

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    blogPostPromptByTone[resolvedTone] ?? blogPostPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getBlogPostUserPrompt(promptInput);

  const allowedIntegrationIds = Array.from(
    new Set(repositories.map((repo) => repo.integrationId))
  );

  const postToolsResult: PostToolsResult = {};
  const postToolsConfig = {
    organizationId,
    contentType: "blog_post",
    sourceMetadata,
  } as const;

  const agent = new ToolLoopAgent({
    model,
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 2500 },
      },
    },
    tools: {
      getPullRequests: createGetPullRequestsTool({
        organizationId,
        allowedIntegrationIds,
      }),
      getReleaseByTag: createGetReleaseByTagTool({
        organizationId,
        allowedIntegrationIds,
      }),
      getCommitsByTimeframe: createGetCommitsByTimeframeTool({
        organizationId,
        allowedIntegrationIds,
      }),
      listAvailableSkills: listAvailableSkills(),
      getSkillByName: getSkillByName(),
      createPost: createCreatePostTool(postToolsConfig, postToolsResult),
      updatePost: createUpdatePostTool(postToolsConfig),
      viewPost: createViewPostTool(postToolsConfig),
      fail: createFailTool(postToolsResult),
    },
    instructions,
    stopWhen: stepCountIs(35),
  });

  await agent.generate({ prompt });

  if (postToolsResult.failReason) {
    throw new Error(postToolsResult.failReason);
  }

  if (!postToolsResult.postId) {
    throw new Error(
      "Blog post agent completed without creating a post. No createPost tool call was made."
    );
  }

  return {
    postId: postToolsResult.postId,
    title: postToolsResult.title ?? "",
  };
}
