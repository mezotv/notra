import { withSupermemory } from "@supermemory/tools/ai-sdk";
import { stepCountIs, ToolLoopAgent } from "ai";
import { gateway } from "@/lib/ai/gateway";
import { getCasualChangelogPrompt } from "@/lib/ai/prompts/changelog/casual";
import { getConversationalChangelogPrompt } from "@/lib/ai/prompts/changelog/conversational";
import { getFormalChangelogPrompt } from "@/lib/ai/prompts/changelog/formal";
import { getProfessionalChangelogPrompt } from "@/lib/ai/prompts/changelog/professional";
import { getChangelogUserPrompt } from "@/lib/ai/prompts/changelog/user";
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
  ChangelogAgentOptions,
  ChangelogAgentResult,
} from "@/types/lib/ai/agents";

const changelogPromptByTone: Record<ToneProfile, () => string> = {
  Conversational: getConversationalChangelogPrompt,
  Professional: getProfessionalChangelogPrompt,
  Casual: getCasualChangelogPrompt,
  Formal: getFormalChangelogPrompt,
};

export async function generateChangelog(
  options: ChangelogAgentOptions
): Promise<ChangelogAgentResult> {
  const {
    organizationId,
    repositories,
    tone = "Conversational",
    promptInput,
    sourceMetadata,
  } = options;

  if (!repositories || repositories.length === 0) {
    throw new Error(
      "At least one repository must be provided to generate a changelog."
    );
  }

  const model = withSupermemory(
    gateway("anthropic/claude-haiku-4.5"),
    organizationId
  );

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    changelogPromptByTone[resolvedTone] ?? changelogPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getChangelogUserPrompt(promptInput);

  const allowedIntegrationIds = Array.from(
    new Set(repositories.map((repo) => repo.integrationId))
  );

  const postToolsResult: PostToolsResult = {};
  const postToolsConfig = {
    organizationId,
    contentType: "changelog",
    sourceMetadata,
  };

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
      "Changelog agent completed without creating a post. No createPost tool call was made."
    );
  }

  return {
    postId: postToolsResult.postId,
    title: postToolsResult.title ?? "",
  };
}
