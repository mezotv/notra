import { withSupermemory } from "@supermemory/tools/ai-sdk";
import { stepCountIs, ToolLoopAgent } from "ai";
import { gateway } from "@/lib/ai/gateway";
import { getCasualLinkedInPrompt } from "@/lib/ai/prompts/linkedin/casual";
import { getConversationalLinkedInPrompt } from "@/lib/ai/prompts/linkedin/conversational";
import { getFormalLinkedInPrompt } from "@/lib/ai/prompts/linkedin/formal";
import { getProfessionalLinkedInPrompt } from "@/lib/ai/prompts/linkedin/professional";
import { getLinkedInUserPrompt } from "@/lib/ai/prompts/linkedin/user";
import {
  createGetCommitsByTimeframeTool,
  createGetPullRequestsTool,
  createGetReleaseByTagTool,
} from "@/lib/ai/tools/github";
import {
  createCreatePostTool,
  createUpdatePostTool,
  createViewPostTool,
  type PostToolsResult,
} from "@/lib/ai/tools/post";
import { getSkillByName, listAvailableSkills } from "@/lib/ai/tools/skills";
import { getValidToneProfile, type ToneProfile } from "@/schemas/brand";
import type {
  LinkedInAgentOptions,
  LinkedInAgentResult,
} from "@/types/lib/ai/agents";

const linkedInPromptByTone: Record<ToneProfile, () => string> = {
  Conversational: getConversationalLinkedInPrompt,
  Professional: getProfessionalLinkedInPrompt,
  Casual: getCasualLinkedInPrompt,
  Formal: getFormalLinkedInPrompt,
};

export async function generateLinkedInPost(
  options: LinkedInAgentOptions
): Promise<LinkedInAgentResult> {
  const {
    organizationId,
    repositories,
    tone = "Conversational",
    promptInput,
    sourceMetadata,
  } = options;

  if (!repositories || repositories.length === 0) {
    throw new Error(
      "At least one repository must be provided to generate a LinkedIn post."
    );
  }

  const model = withSupermemory(
    gateway("anthropic/claude-haiku-4.5"),
    organizationId
  );

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    linkedInPromptByTone[resolvedTone] ?? linkedInPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getLinkedInUserPrompt(promptInput);

  const allowedIntegrationIds = Array.from(
    new Set(repositories.map((repo) => repo.integrationId))
  );

  const postToolsResult: PostToolsResult = {};
  const postToolsConfig = {
    organizationId,
    contentType: "linkedin_post",
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
    },
    instructions,
    stopWhen: stepCountIs(35),
  });

  await agent.generate({ prompt });

  if (!postToolsResult.postId) {
    throw new Error(
      "LinkedIn agent completed without creating a post. No createPost tool call was made."
    );
  }

  return {
    postId: postToolsResult.postId,
    title: postToolsResult.title ?? "",
  };
}
