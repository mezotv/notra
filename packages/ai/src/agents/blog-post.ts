import { createModel } from "@notra/ai/model";
import { getCasualBlogPostPrompt } from "@notra/ai/prompts/blog_post/casual";
import { getConversationalBlogPostPrompt } from "@notra/ai/prompts/blog_post/conversational";
import { getFormalBlogPostPrompt } from "@notra/ai/prompts/blog_post/formal";
import { getProfessionalBlogPostPrompt } from "@notra/ai/prompts/blog_post/professional";
import { getUserPrompt } from "@notra/ai/prompts/user";
import { getValidToneProfile, type ToneProfile } from "@notra/ai/schemas/brand";
import { getAISDKTelemetry } from "@notra/ai/telemetry";
import { buildGitHubDataTools } from "@notra/ai/tools/github";
import { buildLinearDataTools } from "@notra/ai/tools/linear";
import {
  createCreatePostTool,
  createFailTool,
  createUpdatePostTool,
  createViewPostTool,
} from "@notra/ai/tools/post";
import { getSkillByName, listAvailableSkills } from "@notra/ai/tools/skills";
import type {
  BlogPostAgentOptions,
  BlogPostAgentResult,
} from "@notra/ai/types/agents";
import type {
  PostToolsConfig,
  PostToolsResult,
} from "@notra/ai/types/post-tools";
import { stepCountIs, ToolLoopAgent } from "ai";

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
    linearIntegrations,
    tone = "Conversational",
    promptInput,
    sourceMetadata,
    dataPointSettings,
    selectionFilters,
    commitWindow,
    autoPublish,
    resolveContext,
    resolveLinearContext,
  } = options;

  if (
    (!repositories || repositories.length === 0) &&
    (!linearIntegrations || linearIntegrations.length === 0)
  ) {
    throw new Error(
      "At least one repository or Linear integration must be provided to generate a blog post."
    );
  }

  const model = createModel(organizationId, "anthropic/claude-haiku-4.5");

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    blogPostPromptByTone[resolvedTone] ?? blogPostPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getUserPrompt("blog post", promptInput);

  const allowedIntegrationIds = Array.from(
    new Set((repositories ?? []).map((repo) => repo.integrationId))
  );

  const allowedLinearIntegrationIds = Array.from(
    new Set((linearIntegrations ?? []).map((li) => li.integrationId))
  );

  const postToolsResult: PostToolsResult = {};
  const postToolsConfig: PostToolsConfig = {
    organizationId,
    contentType: "blog_post",
    sourceMetadata,
    autoPublish,
  };

  const agent = new ToolLoopAgent({
    model,
    experimental_telemetry: await getAISDKTelemetry("generateBlogPost", {
      organizationId,
      metadata: {
        agent: "blog_post",
        contentType: "blog_post",
      },
    }),
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 4096 },
      },
    },
    tools: {
      ...buildGitHubDataTools({
        organizationId,
        allowedIntegrationIds,
        dataPointSettings,
        selectionFilters,
        commitWindow,
        resolveContext,
      }),
      ...buildLinearDataTools({
        organizationId,
        allowedIntegrationIds: allowedLinearIntegrationIds,
        dataPointSettings,
        resolveContext: resolveLinearContext,
      }),
      listAvailableSkills: listAvailableSkills(),
      getSkillByName: getSkillByName(),
      createPost: createCreatePostTool(postToolsConfig, postToolsResult),
      updatePost: createUpdatePostTool(postToolsConfig, postToolsResult),
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

  if (!postToolsResult.posts?.length) {
    throw new Error(
      "Blog post agent completed without creating a post. No createPost tool call was made."
    );
  }

  const primaryPost = postToolsResult.posts[0];

  if (!primaryPost) {
    throw new Error("Blog post agent did not return a primary post.");
  }

  return {
    postId: primaryPost.postId,
    title: primaryPost.title,
    posts: postToolsResult.posts,
  };
}
