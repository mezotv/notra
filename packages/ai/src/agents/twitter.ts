import { createModel } from "@notra/ai/model";
import { getCasualTwitterPrompt } from "@notra/ai/prompts/twitter/casual";
import { getConversationalTwitterPrompt } from "@notra/ai/prompts/twitter/conversational";
import { getFormalTwitterPrompt } from "@notra/ai/prompts/twitter/formal";
import { getProfessionalTwitterPrompt } from "@notra/ai/prompts/twitter/professional";
import { getUserPrompt } from "@notra/ai/prompts/user";
import { getValidToneProfile, type ToneProfile } from "@notra/ai/schemas/brand";
import { getAISDKTelemetry } from "@notra/ai/telemetry";
import {
  createGetBrandReferencesTool,
  createSearchBrandReferencesTool,
} from "@notra/ai/tools/brand-references";
import { buildGitHubDataTools } from "@notra/ai/tools/github";
import {
  createCreatePostTool,
  createFailTool,
  createUpdatePostTool,
  createViewPostTool,
} from "@notra/ai/tools/post";
import { getSkillByName, listAvailableSkills } from "@notra/ai/tools/skills";
import type {
  TwitterAgentOptions,
  TwitterAgentResult,
} from "@notra/ai/types/agents";
import type {
  PostToolsConfig,
  PostToolsResult,
} from "@notra/ai/types/post-tools";
import { stepCountIs, ToolLoopAgent } from "ai";

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
    resolveContext,
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
  const prompt = getUserPrompt("tweet", promptInput);

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
      searchBrandReferences: createSearchBrandReferencesTool({
        organizationId,
        voiceId,
        agentType: "twitter",
      }),
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
        resolveContext,
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
