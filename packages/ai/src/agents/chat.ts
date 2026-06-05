import { getEnabledMcpServerCount } from "@notra/ai/integrations/mcp-tool-index";
import { createModel } from "@notra/ai/model";
import { routeMessage, selectModel } from "@notra/ai/orchestration/router";
import { withGatewayAutomaticCaching } from "@notra/ai/provider-options";
import { createMarkdownTools } from "@notra/ai/tools/edit-markdown";
import { exampleTool } from "@notra/ai/tools/example";
import { createLazyMcpRuntime } from "@notra/ai/tools/mcp-lazy";
import { getSkillByName, listAvailableSkills } from "@notra/ai/tools/skills";
import {
  createWebSearchTool,
  isWebSearchAvailable,
  WEB_SEARCH_TOOL_DESCRIPTION,
  WEB_SEARCH_TOOL_NAME,
} from "@notra/ai/tools/web-search";
import type { ChatAgentContext } from "@notra/ai/types/agents";
import { buildExperimentalTelemetry } from "@notra/ai/utils/tcc";
import { stepCountIs, type Tool, ToolLoopAgent } from "ai";

export async function createChatAgent(
  context: ChatAgentContext,
  instruction: string
) {
  const { organizationId } = context;
  const isDev = process.env.NODE_ENV === "development";
  const hasWebSearch = isWebSearchAvailable();
  const hasMcp = (await getEnabledMcpServerCount(organizationId)) > 0;
  const decision = await routeMessage(
    instruction,
    hasMcp || hasWebSearch,
    context.log,
    false,
    context.telemetryMetadata
  );
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

  const baseTools: Record<string, Tool> = {
    getMarkdown,
    editMarkdown,
    listAvailableSkills: listAvailableSkills({ organizationId }),
    getSkillByName: getSkillByName({ organizationId }),
    ...(hasWebSearch ? { [WEB_SEARCH_TOOL_NAME]: createWebSearchTool() } : {}),
    ...(isDev ? { example: exampleTool() } : {}),
  };
  const lazyMcpRuntime = hasMcp
    ? await createLazyMcpRuntime({
        organizationId,
        sessionId: getEditorSessionId(context),
        surface: "editor-chat",
        baseActiveToolNames: Object.keys(baseTools),
      })
    : null;
  let mcpCleanupStarted = false;
  const cleanupMcpTools = async () => {
    if (mcpCleanupStarted) {
      return;
    }
    mcpCleanupStarted = true;
    await lazyMcpRuntime?.cleanup();
  };

  const selectionContext = context.selectedText
    ? `\n\nThe user has selected the following text (focus changes on this area):\n"""\n${context.selectedText}\n"""`
    : "";

  const brandContext = context.brandContext
    ? `\n\nBrand identity context:\n${context.brandContext}`
    : "";

  const agent = new ToolLoopAgent({
    model: modelWithMemory,
    providerOptions: withGatewayAutomaticCaching(),
    tools: lazyMcpRuntime
      ? { ...baseTools, ...lazyMcpRuntime.tools }
      : baseTools,
    ...(lazyMcpRuntime
      ? {
          activeTools: lazyMcpRuntime.initialActiveTools,
          prepareStep: lazyMcpRuntime.prepareStep,
        }
      : {}),
    instructions: `You are a content editor assistant for a markdown document. You have two response modes depending on what the user asks.${brandContext}

## Skills are first-class
This organization has writing skills stored in a database (examples: a "humanizer" skill for removing AI-sounding text, plus content-type skills and any custom skills the user created). You do NOT know them ahead of time — you MUST call listAvailableSkills to discover what exists. NEVER make up skill names or claim to have skills you haven't verified via the tool.

${hasWebSearch || lazyMcpRuntime?.descriptions.length ? `## Available Capabilities\n${[hasWebSearch ? `- ${WEB_SEARCH_TOOL_DESCRIPTION}` : "", ...(lazyMcpRuntime?.descriptions ?? []).map((description) => `- ${description}`)].filter(Boolean).join("\n")}\n` : ""}

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
    async onFinish() {
      await cleanupMcpTools();
    },
    experimental_telemetry: buildExperimentalTelemetry(
      context.telemetryMetadata
    ),
  });

  const generate = agent.generate.bind(agent);
  agent.generate = async (parameters) => {
    try {
      return await generate(parameters);
    } catch (error) {
      await cleanupMcpTools();
      throw error;
    }
  };

  const stream = agent.stream.bind(agent);
  agent.stream = async (parameters) => {
    try {
      const result = await stream(parameters);
      const toUIMessageStream = result.toUIMessageStream.bind(result);
      result.toUIMessageStream = ((options) =>
        withCleanupOnReadableStreamClose(
          toUIMessageStream(options),
          cleanupMcpTools
        )) as typeof result.toUIMessageStream;
      return result;
    } catch (error) {
      await cleanupMcpTools();
      throw error;
    }
  };

  return agent;
}

function withCleanupOnReadableStreamClose<TStream extends ReadableStream>(
  stream: TStream,
  cleanup: () => Promise<void>
): TStream {
  const reader = stream.getReader();
  let cleanupPromise: Promise<void> | null = null;
  const cleanupOnce = () => {
    cleanupPromise ??= cleanup();
    return cleanupPromise;
  };

  return new ReadableStream({
    async pull(controller) {
      let result: ReadableStreamReadResult<unknown>;
      try {
        result = await reader.read();
      } catch (error) {
        await cleanupOnce();
        throw error;
      }

      const { done, value } = result;
      if (done) {
        await cleanupOnce();
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason);
      } finally {
        await cleanupOnce();
      }
    },
  }) as TStream;
}

function getEditorSessionId(context: ChatAgentContext) {
  if (context.sessionId) {
    return context.sessionId;
  }
  const metadataSessionId = getFirstMetadataString(context, [
    "chatId",
    "tcc.sessionId",
    "contentId",
    "postId",
    "currentPostId",
    "documentId",
  ]);
  if (metadataSessionId) {
    return metadataSessionId;
  }

  // Last-resort compatibility fallback for callers that have not been wired to
  // pass a stable editor session id yet. This preserves activation continuity
  // across turns, but callers should prefer context.sessionId to avoid sharing
  // activations across editor chats in the same organization.
  return `editor:${context.organizationId}:default`;
}

function getFirstMetadataString(
  context: ChatAgentContext,
  keys: readonly string[]
) {
  for (const key of keys) {
    const value = context.telemetryMetadata?.[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}
