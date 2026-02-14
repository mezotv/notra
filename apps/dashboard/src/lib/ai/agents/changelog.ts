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
import { z } from "zod";
import { gateway } from "@/lib/ai/gateway";
import { getCasualChangelogPrompt } from "@/lib/ai/prompts/changelog/casual";
import { getConversationalChangelogPrompt } from "@/lib/ai/prompts/changelog/conversational";
import { getFormalChangelogPrompt } from "@/lib/ai/prompts/changelog/formal";
import { getProfessionalChangelogPrompt } from "@/lib/ai/prompts/changelog/professional";
import type { ChangelogTonePromptInput } from "@/lib/ai/prompts/changelog/types";
import { getChangelogUserPrompt } from "@/lib/ai/prompts/changelog/user";
import {
  createGetCommitsByTimeframeTool,
  createGetPullRequestsTool,
  createGetReleaseByTagTool,
} from "@/lib/ai/tools/github";
import { getSkillByName, listAvailableSkills } from "@/lib/ai/tools/skills";
import { getValidToneProfile, type ToneProfile } from "@/utils/schemas/brand";

export const changelogOutputSchema = z.object({
  title: z.string().max(120).describe("The changelog title, no markdown"),
  markdown: z
    .string()
    .describe(
      "The full changelog content body as markdown/MDX, without the title heading (title is a separate field)"
    ),
});

export type ChangelogOutput = z.infer<typeof changelogOutputSchema>;

export interface ChangelogAgentResult {
  output: ChangelogOutput;
}

export interface ChangelogAgentOptions {
  organizationId: string;
  repositories: Array<{ owner: string; repo: string }>;
  tone?: ToneProfile;
  promptInput: ChangelogTonePromptInput;
}

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

  const model = wrapLanguageModel({
    model: withSupermemory(
      gateway("anthropic/claude-haiku-4.5"),
      organizationId
    ),
    middleware: extractJsonMiddleware(),
  });

  const resolvedTone: ToneProfile = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    changelogPromptByTone[resolvedTone] ?? changelogPromptByTone.Conversational;
  const instructions = promptFactory();
  const prompt = getChangelogUserPrompt(promptInput);

  const agent = new ToolLoopAgent({
    model,
    output: Output.object({
      schema: changelogOutputSchema,
    }),
    tools: {
      getPullRequests: createGetPullRequestsTool({
        organizationId,
        allowedRepositories: repositories,
      }),
      getReleaseByTag: createGetReleaseByTagTool({
        organizationId,
        allowedRepositories: repositories,
      }),
      getCommitsByTimeframe: createGetCommitsByTimeframeTool({
        organizationId,
        allowedRepositories: repositories,
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
