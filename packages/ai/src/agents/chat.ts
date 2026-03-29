import { createModel } from "@notra/ai/model";
import { routeMessage, selectModel } from "@notra/ai/orchestration/router";
import { createMarkdownTools } from "@notra/ai/tools/edit-markdown";
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
      listAvailableSkills: listAvailableSkills(),
      getSkillByName: getSkillByName(),
    },
    instructions: `You are a content editor assistant. Help users edit their markdown documents.${brandContext}

## Workflow
1. Use getMarkdown to see the document with line numbers
2. Use editMarkdown to apply changes (work from bottom to top)

## Edit Operations
- replaceLine: { op: "replaceLine", line: number, content: string }
- replaceRange: { op: "replaceRange", startLine: number, endLine: number, content: string }
- insert: { op: "insert", afterLine: number, content: string }
- deleteLine: { op: "deleteLine", line: number }
- deleteRange: { op: "deleteRange", startLine: number, endLine: number }

## Guidelines
- Make minimal edits
- Line numbers are 1-indexed
- For multi-line content use \\n in content string
- When user selects text, focus only on that section
- IMPORTANT: Do NOT output the content of your edits in text. Only use the editMarkdown tool. Keep text responses brief - just explain what you're doing, not the actual content.
- When you are completely done with all edits, end with a final short message (1 sentence max) summarizing what you changed. This must be your last text output.
- Never use em dashes (—) or en dashes (–) in any content. Use hyphens (-) or rewrite the sentence instead.
${selectionContext}`,
    stopWhen: stepCountIs(15),
  });
}
