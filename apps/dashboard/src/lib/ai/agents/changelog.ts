import { withSupermemory } from "@supermemory/tools/ai-sdk";
import { gateway, Output, stepCountIs, ToolLoopAgent } from "ai";
import { z } from "zod";
import { getCasualChangelogPrompt } from "@/lib/ai/prompts/changelog/casual";
import { getConversationalChangelogPrompt } from "@/lib/ai/prompts/changelog/conversational";
import { getFormalChangelogPrompt } from "@/lib/ai/prompts/changelog/formal";
import { getProfessionalChangelogPrompt } from "@/lib/ai/prompts/changelog/professional";
import type { ChangelogTonePromptInput } from "@/lib/ai/prompts/changelog/types";
import {
  createGetCommitsByTimeframeTool,
  createGetPullRequestsTool,
  createGetReleaseByTagTool,
} from "@/lib/ai/tools/github";
import { getSkillByName, listAvailableSkills } from "@/lib/ai/tools/skills";
import { openrouter } from "@/lib/openrouter";
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

const changelogPromptByTone: Record<
  ToneProfile,
  (params: ChangelogTonePromptInput) => string
> = {
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

  const modelWithMemory = withSupermemory(
    gateway("anthropic/claude-sonnet-4.5"),
    organizationId
  );

  const resolvedTone: ToneProfile = getValidToneProfile(tone, "Conversational");

  const promptFactory =
    changelogPromptByTone[resolvedTone] ?? changelogPromptByTone.Conversational;
  const prompt = promptFactory(promptInput);

  const agentInstructions =
    "You write changelogs from GitHub activity. Follow the user prompt exactly and use tools only when needed. " +
    "CRITICAL: Return only a single JSON object matching the output schema with exactly two string fields: title and markdown. " +
    "Do not output markdown, commentary, or code fences. Ensure the JSON is valid (double quotes, no trailing commas). " +
    "If the markdown field spans multiple lines, encode line breaks as \\n within the JSON string.";

  const agent = new ToolLoopAgent({
    model: modelWithMemory,
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
    instructions: agentInstructions,
    stopWhen: stepCountIs(35),
  });

  const agentResult = await agent.generate({ prompt });

  return { output: agentResult.output };
}
