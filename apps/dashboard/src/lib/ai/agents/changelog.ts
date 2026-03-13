import { stepCountIs, ToolLoopAgent } from "ai";
import { createModel } from "@/lib/ai/model";
import { getCasualChangelogPrompt } from "@/lib/ai/prompts/changelog/casual";
import { getConversationalChangelogPrompt } from "@/lib/ai/prompts/changelog/conversational";
import { getFormalChangelogPrompt } from "@/lib/ai/prompts/changelog/formal";
import { getProfessionalChangelogPrompt } from "@/lib/ai/prompts/changelog/professional";
import { getChangelogUserPrompt } from "@/lib/ai/prompts/changelog/user";
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
  ChangelogAgentOptions,
  ChangelogAgentResult,
} from "@/types/ai/agents";
import type { PostToolsConfig, PostToolsResult } from "@/types/ai/post-tools";

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
      "At least one repository must be provided to generate a changelog."
    );
  }

  const model = createModel(organizationId, "anthropic/claude-haiku-4.5");

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    changelogPromptByTone[resolvedTone] ?? changelogPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getChangelogUserPrompt(promptInput);

  const allowedIntegrationIds = Array.from(
    new Set(repositories.map((repo) => repo.integrationId))
  );

  const postToolsResult: PostToolsResult = {};
  const postToolsConfig: PostToolsConfig = {
    organizationId,
    contentType: "changelog",
    sourceMetadata,
    autoPublish,
  };

  const agent = new ToolLoopAgent({
    model,
    experimental_telemetry: await getAISDKTelemetry("generateChangelog", {
      organizationId,
      metadata: {
        agent: "changelog",
        contentType: "changelog",
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
        agentType: "changelog",
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
      "Changelog agent completed without creating a post. No createPost tool call was made."
    );
  }

  const primaryPost = postToolsResult.posts[0];

  if (!primaryPost) {
    throw new Error("Changelog agent did not return a primary post.");
  }

  return {
    postId: primaryPost.postId,
    title: primaryPost.title,
    posts: postToolsResult.posts,
  };
}
