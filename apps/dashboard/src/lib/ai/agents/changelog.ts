import { withSupermemory } from "@supermemory/tools/ai-sdk";
import {
  extractJsonMiddleware,
  NoObjectGeneratedError,
  Output,
  parsePartialJson,
  stepCountIs,
  ToolLoopAgent,
  wrapLanguageModel,
} from "ai";
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
import { getSkillByName, listAvailableSkills } from "@/lib/ai/tools/skills";
import { changelogOutputSchema } from "@/schemas/ai/agents";
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
  } = options;

  if (!repositories || repositories.length === 0) {
    throw new Error(
      "At least one repository must be provided to generate a changelog."
    );
  }

  const model = wrapLanguageModel({
    model: withSupermemory(
      gateway("anthropic/claude-haiku-4.5"),
      organizationId
    ),
    middleware: extractJsonMiddleware(),
  });

  const resolvedTone = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    changelogPromptByTone[resolvedTone] ?? changelogPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getChangelogUserPrompt(promptInput);

  const allowedIntegrationIds = Array.from(
    new Set(repositories.map((repo) => repo.integrationId))
  );

  const agent = new ToolLoopAgent({
    model,
    output: Output.object({
      schema: changelogOutputSchema,
    }),
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
    },
    instructions,
    stopWhen: stepCountIs(35),
  });

  try {
    const result = await agent.generate({ prompt });
    return { output: result.output };
  } catch (error) {
    if (!NoObjectGeneratedError.isInstance(error) || !error.text) {
      throw error;
    }
    const { state, value } = await parsePartialJson(error.text);
    if (
      (state === "repaired-parse" || state === "successful-parse") &&
      value != null
    ) {
      const parsed = changelogOutputSchema.safeParse(value);
      if (parsed.success) {
        return { output: parsed.data };
      }
    }
    throw error;
  }
}
