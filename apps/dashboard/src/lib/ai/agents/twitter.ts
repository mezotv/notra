import { stepCountIs, ToolLoopAgent } from "ai";
import { createModel } from "@/lib/ai/model";
import { getCasualTwitterPrompt } from "@/lib/ai/prompts/twitter/casual";
import { getConversationalTwitterPrompt } from "@/lib/ai/prompts/twitter/conversational";
import { getFormalTwitterPrompt } from "@/lib/ai/prompts/twitter/formal";
import { getProfessionalTwitterPrompt } from "@/lib/ai/prompts/twitter/professional";
import { getTwitterUserPrompt } from "@/lib/ai/prompts/twitter/user";
import { getAISDKTelemetry } from "@/lib/ai/telemetry";
import { createGetBrandReferencesTool } from "@/lib/ai/tools/brand-references";
import { buildGitHubDataTools } from "@/lib/ai/tools/github";
import {
  createCreatePostTool,
  createFailTool,
  createUpdatePostTool,
  createViewPostTool,
} from "@/lib/ai/tools/post";
import { getSkillByName, listAvailableSkills } from "@/lib/ai/tools/skills";
import { getValidToneProfile, type ToneProfile } from "@/schemas/brand";
import type {
  TwitterAgentOptions,
  TwitterAgentResult,
} from "@/types/ai/agents";
import type { PostToolsConfig, PostToolsResult } from "@/types/ai/post-tools";

const twitterPromptByTone: Record<ToneProfile, () => string> = {
  Conversational: getConversationalTwitterPrompt,
  Professional: getProfessionalTwitterPrompt,
  Casual: getCasualTwitterPrompt,
  Formal: getFormalTwitterPrompt,
};

export async function generateTwitterPost(
  options: TwitterAgentOptions
): Promise<TwitterAgentResult> {
  const {
    organizationId,
    voiceId,
    repositories,
    tone = "Conversational",
    promptInput,
    sourceMetadata,
    dataPointSettings,
    selectionFilters,
    commitWindow,
    autoPublish,
  } = options;

  if (!repositories || repositories.length === 0) {
    throw new Error(
      "At least one repository must be provided to generate a Twitter post."
    );
  }

  const model = createModel(organizationId, "anthropic/claude-haiku-4.5");

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    twitterPromptByTone[resolvedTone] ?? twitterPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getTwitterUserPrompt(promptInput);

  const allowedIntegrationIds = Array.from(
    new Set(repositories.map((repo) => repo.integrationId))
  );

  const postToolsResult: PostToolsResult = {};
  const postToolsConfig: PostToolsConfig = {
    organizationId,
    contentType: "twitter_post",
    sourceMetadata,
    autoPublish,
  };

  const agent = new ToolLoopAgent({
    model,
    experimental_telemetry: await getAISDKTelemetry("generateTwitterPost", {
      organizationId,
      metadata: {
        agent: "twitter",
        contentType: "twitter_post",
      },
    }),
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 2500 },
      },
    },
    tools: {
      getBrandReferences: createGetBrandReferencesTool({
        organizationId,
        voiceId,
        agentType: "twitter",
      }),
      ...buildGitHubDataTools({
        organizationId,
        allowedIntegrationIds,
        dataPointSettings,
        selectionFilters,
        commitWindow,
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
      "Twitter agent completed without creating a post. No createPost tool call was made."
    );
  }

  const primaryPost = postToolsResult.posts[0];

  if (!primaryPost) {
    throw new Error("Twitter agent did not return a primary post.");
  }

  return {
    postId: primaryPost.postId,
    title: primaryPost.title,
    posts: postToolsResult.posts,
  };
}
