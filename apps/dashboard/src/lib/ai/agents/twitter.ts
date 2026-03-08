import { withSupermemory } from "@supermemory/tools/ai-sdk";
import { stepCountIs, ToolLoopAgent } from "ai";
import { gateway } from "@/lib/ai/gateway";
import { getCasualTwitterPrompt } from "@/lib/ai/prompts/twitter/casual";
import { getConversationalTwitterPrompt } from "@/lib/ai/prompts/twitter/conversational";
import { getFormalTwitterPrompt } from "@/lib/ai/prompts/twitter/formal";
import { getProfessionalTwitterPrompt } from "@/lib/ai/prompts/twitter/professional";
import { getTwitterUserPrompt } from "@/lib/ai/prompts/twitter/user";
import { createGetBrandReferencesTool } from "@/lib/ai/tools/brand-references";
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
  TwitterAgentOptions,
  TwitterAgentResult,
} from "@/types/ai/agents";

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
  } = options;

  if (!repositories || repositories.length === 0) {
    throw new Error(
      "At least one repository must be provided to generate a Twitter post."
    );
  }

  const model = withSupermemory(
    gateway("anthropic/claude-haiku-4.5"),
    organizationId
  );

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    twitterPromptByTone[resolvedTone] ?? twitterPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getTwitterUserPrompt(promptInput);

  const allowedIntegrationIds = Array.from(
    new Set(repositories.map((repo) => repo.integrationId))
  );

  const postToolsResult: PostToolsResult = {};
  const postToolsConfig = {
    organizationId,
    contentType: "twitter_post",
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
      getBrandReferences: createGetBrandReferencesTool({
        organizationId,
        voiceId,
        agentType: "twitter",
      }),
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
      "Twitter agent completed without creating a post. No createPost tool call was made."
    );
  }

  return {
    postId: postToolsResult.postId,
    title: postToolsResult.title ?? "",
  };
}
