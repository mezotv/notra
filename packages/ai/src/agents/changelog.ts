import { createModel } from "@notra/ai/model";
import { getCasualChangelogPrompt } from "@notra/ai/prompts/changelog/casual";
import { getConversationalChangelogPrompt } from "@notra/ai/prompts/changelog/conversational";
import { getFormalChangelogPrompt } from "@notra/ai/prompts/changelog/formal";
import { getProfessionalChangelogPrompt } from "@notra/ai/prompts/changelog/professional";
import { getUserPrompt } from "@notra/ai/prompts/user";
import { getValidToneProfile, type ToneProfile } from "@notra/ai/schemas/brand";
import { getAISDKTelemetry } from "@notra/ai/telemetry";
import { createGetBrandReferencesTool } from "@notra/ai/tools/brand-references";
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
  ChangelogAgentOptions,
  ChangelogAgentResult,
} from "@notra/ai/types/agents";
import type {
  PostToolsConfig,
  PostToolsResult,
} from "@notra/ai/types/post-tools";
import { stepCountIs, ToolLoopAgent } from "ai";

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
      "At least one repository or Linear integration must be provided to generate a changelog."
    );
  }

  const model = createModel(organizationId, "anthropic/claude-haiku-4.5");

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    changelogPromptByTone[resolvedTone] ?? changelogPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getUserPrompt("changelog", promptInput);

  const allowedIntegrationIds = Array.from(
    new Set((repositories ?? []).map((repo) => repo.integrationId))
  );

  const allowedLinearIntegrationIds = Array.from(
    new Set((linearIntegrations ?? []).map((li) => li.integrationId))
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
        thinking: { type: "enabled", budgetTokens: 4096 },
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
