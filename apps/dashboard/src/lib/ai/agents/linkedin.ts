import { stepCountIs, ToolLoopAgent } from "ai";
import { createModel } from "@/lib/ai/model";
import { getCasualLinkedInPrompt } from "@/lib/ai/prompts/linkedin/casual";
import { getConversationalLinkedInPrompt } from "@/lib/ai/prompts/linkedin/conversational";
import { getFormalLinkedInPrompt } from "@/lib/ai/prompts/linkedin/formal";
import { getProfessionalLinkedInPrompt } from "@/lib/ai/prompts/linkedin/professional";
import { getLinkedInUserPrompt } from "@/lib/ai/prompts/linkedin/user";
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
  LinkedInAgentOptions,
  LinkedInAgentResult,
} from "@/types/ai/agents";
import type { PostToolsConfig, PostToolsResult } from "@/types/ai/post-tools";

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
      "At least one repository must be provided to generate a LinkedIn post."
    );
  }

  const model = createModel(organizationId, "anthropic/claude-haiku-4.5");

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    linkedInPromptByTone[resolvedTone] ?? linkedInPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getLinkedInUserPrompt(promptInput);

  const allowedIntegrationIds = Array.from(
    new Set(repositories.map((repo) => repo.integrationId))
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
        thinking: { type: "enabled", budgetTokens: 2500 },
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
