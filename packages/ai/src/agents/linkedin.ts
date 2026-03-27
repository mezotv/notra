import { createModel } from "@notra/ai/model";
import { getCasualLinkedInPrompt } from "@notra/ai/prompts/linkedin/casual";
import { getConversationalLinkedInPrompt } from "@notra/ai/prompts/linkedin/conversational";
import { getFormalLinkedInPrompt } from "@notra/ai/prompts/linkedin/formal";
import { getProfessionalLinkedInPrompt } from "@notra/ai/prompts/linkedin/professional";
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
  LinkedInAgentOptions,
  LinkedInAgentResult,
} from "@notra/ai/types/agents";
import type {
  PostToolsConfig,
  PostToolsResult,
} from "@notra/ai/types/post-tools";
import { stepCountIs, ToolLoopAgent } from "ai";

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
      "At least one repository or Linear integration must be provided to generate a LinkedIn post."
    );
  }

  const model = createModel(organizationId, "anthropic/claude-haiku-4.5");

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    linkedInPromptByTone[resolvedTone] ?? linkedInPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getUserPrompt("LinkedIn post", promptInput);

  const allowedIntegrationIds = Array.from(
    new Set((repositories ?? []).map((repo) => repo.integrationId))
  );

  const allowedLinearIntegrationIds = Array.from(
    new Set((linearIntegrations ?? []).map((li) => li.integrationId))
  );

  const postToolsResult: PostToolsResult = {};
  const postToolsConfig: PostToolsConfig = {
    organizationId,
    contentType: "linkedin_post",
    sourceMetadata,
    autoPublish,
  };

  const agent = new ToolLoopAgent({
    model,
    experimental_telemetry: await getAISDKTelemetry("generateLinkedInPost", {
      organizationId,
      metadata: {
        agent: "linkedin",
        contentType: "linkedin_post",
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
        agentType: "linkedin",
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
      "LinkedIn agent completed without creating a post. No createPost tool call was made."
    );
  }

  const primaryPost = postToolsResult.posts[0];

  if (!primaryPost) {
    throw new Error("LinkedIn agent did not return a primary post.");
  }

  return {
    postId: primaryPost.postId,
    title: primaryPost.title,
    posts: postToolsResult.posts,
  };
}
