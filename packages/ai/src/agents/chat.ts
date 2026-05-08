import { createModel } from "@notra/ai/model";
import { routeMessage, selectModel } from "@notra/ai/orchestration/router";
import { createMarkdownTools } from "@notra/ai/tools/edit-markdown";
import { exampleTool } from "@notra/ai/tools/example";
import { getSkillByName, listAvailableSkills } from "@notra/ai/tools/skills";
import type { ChatAgentContext } from "@notra/ai/types/agents";
import { stepCountIs, ToolLoopAgent } from "ai";

export async function createChatAgent(
  context: ChatAgentContext,
  instruction: string
) {
  const { organizationId } = context;
  const decision = await routeMessage(instruction, false, context.log);
  const model = selectModel(decision);

  const modelWithMemory = createModel(
    context.organizationId,
    model,
    undefined,
    context.log
  );

  const { getMarkdown, editMarkdown } = createMarkdownTools({
    currentMarkdown: context.currentMarkdown,
    onUpdate: context.onMarkdownUpdate,
  });

  const isDev = process.env.NODE_ENV === "development";

  const selectionContext = context.selectedText
    ? `\n\nThe user has selected the following text (focus changes on this area):\n"""\n${context.selectedText}\n"""`
    : "";

  const brandContext = context.brandContext
    ? `\n\nBrand identity context:\n${context.brandContext}`
    : "";

  return new ToolLoopAgent({
    model: modelWithMemory,
    tools: {
      getMarkdown,
      editMarkdown,
      listAvailableSkills: listAvailableSkills({ organizationId }),
      getSkillByName: getSkillByName({ organizationId }),
      ...(isDev ? { example: exampleTool() } : {}),
    },
    instructions: `You are a content editor assistant for a markdown document. You have two response modes depending on what the user asks.${brandContext}

## Skills are first-class
This organization has writing skills stored in a database (examples: a "humanizer" skill for removing AI-sounding text, plus content-type skills and any custom skills the user created). You do NOT know them ahead of time — you MUST call listAvailableSkills to discover what exists. NEVER make up skill names or claim to have skills you haven't verified via the tool.

## Mode A — Information queries (no edit needed)
Triggers: "what skills do you have", "what can you do", "list your skills", "describe skill X", "is there a skill for Y", etc.

1. Call listAvailableSkills. Use the returned name + description for every skill in your answer. If the user asks about a specific skill, also call getSkillByName to load it and summarize its guidance.
2. Respond in plain text with the accurate list. Do not edit the document.

## Mode B — Edit requests
Triggers: the user wants the document changed (rewrite, shorten, tone change, cleanup, etc.).

1. Call getMarkdown to see the document with line numbers.
2. Call listAvailableSkills. If any skill matches what the user asked (e.g. "humanizer" for making writing more natural, or a tone/domain skill whose description fits), call getSkillByName to load it and follow its guidance while editing. When in doubt, load the skill — don't skip.
3. Call editMarkdown to apply changes (work from bottom to top).

## Edit Operations
- replaceLine: { op: "replaceLine", line: number, content: string }
- replaceRange: { op: "replaceRange", startLine: number, endLine: number, content: string }
- insert: { op: "insert", afterLine: number, content: string }
- deleteLine: { op: "deleteLine", line: number }
- deleteRange: { op: "deleteRange", startLine: number, endLine: number }

## Guidelines
- Always assume the user wants to edit this specific document, not some pasted markdown
- Make minimal edits
- Line numbers are 1-indexed
- For multi-line content use \\n in content string
- When user selects text, focus only on that section
- IMPORTANT: Do NOT output the content of your edits in text. Only use the editMarkdown tool. Keep text responses brief - just explain what you're doing, not the actual content.
- When you are completely done with all edits, end with a final short message (1 sentence max) summarizing what you changed. This must be your last text output.
- Never use em dashes (—) or en dashes (–) in any content. Use hyphens (-) or rewrite the sentence instead.${
      isDev
        ? `
- If the user mentions the word "example" (or explicitly asks to test/trigger the example tool), ALWAYS call the \`example\` tool with a short message. This is a dummy tool used for testing the UI.`
        : ""
    }
${selectionContext}`,
    stopWhen: stepCountIs(15),
  });
}
