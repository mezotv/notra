import { withSupermemory } from "@supermemory/tools/ai-sdk";
import { generateText, Output, stepCountIs, ToolLoopAgent } from "ai";
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
import type { ToneProfile } from "@/utils/schemas/brand";

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
  const { organizationId, tone = "Conversational", promptInput } = options;

  const modelWithMemory = withSupermemory(
    openrouter("moonshotai/kimi-k2.5", {
      reasoning: {
        max_tokens: 4096,
      },
    }),
    organizationId
  );

  const promptFactory = changelogPromptByTone[tone];
  const prompt = promptFactory(promptInput);

  const agent = new ToolLoopAgent({
    model: modelWithMemory,
    tools: {
      getPullRequests: createGetPullRequestsTool(),
      getReleaseByTag: createGetReleaseByTagTool(),
      getCommitsByTimeframe: createGetCommitsByTimeframeTool(),
      listAvailableSkills: listAvailableSkills(),
      getSkillByName: getSkillByName(),
    },
    instructions:
      "You write changelogs from GitHub activity. Follow the user prompt exactly and use tools only when needed.",
    stopWhen: stepCountIs(31),
  });

  const agentResult = await agent.generate({ prompt });

  const { output } = await generateText({
    model: openrouter("moonshotai/kimi-k2.5"),
    output: Output.object({
      schema: changelogOutputSchema,
    }),
    prompt: `Extract the title and markdown body from the following changelog text. The title should be plain text (no markdown formatting, max 120 characters). The markdown should be the full changelog body without the title heading.\n\n${agentResult.text}`,
  });

  if (!output) {
    throw new Error("Failed to extract structured output from changelog");
  }

  return { output };
}
