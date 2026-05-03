import { createModel } from "@notra/ai/model";
import type { AILogTarget } from "@notra/ai/observability";
import { getContentEditorChatPrompt } from "@notra/ai/prompts/content-editor";
import { buildExperimentalTelemetry } from "@notra/ai/utils/tcc";
import type {
  ResolveIntegrationContext,
  ResolveLinearIntegrationContext,
} from "@notra/ai/types/agents";
import type {
  IntegrationFetchers,
  OrchestrateInput,
  OrchestrateResult,
} from "@notra/ai/types/orchestration";
import {
  convertToModelMessages,
  type LanguageModelUsage,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { addAnthropicPromptCaching } from "../utils/prompt-caching";
import {
  hasEnabledGitHubIntegration,
  hasEnabledLinearIntegration,
  validateIntegrations,
} from "./integration-validator";
import { routeAndSelectModel } from "./router";
import {
  buildToolSet,
  getLinearContextFromIntegrations,
  getRepoContextFromIntegrations,
} from "./tool-registry";

export interface OrchestrateDeps {
  integrationFetchers?: IntegrationFetchers;
  resolveContext?: ResolveIntegrationContext;
  resolveLinearContext?: ResolveLinearIntegrationContext;
  onUsage?: (
    usage: LanguageModelUsage,
    modelId: string
  ) => void | Promise<void>;
  log?: AILogTarget;
}

export async function orchestrateChat(
  input: OrchestrateInput,
  deps?: OrchestrateDeps
): Promise<OrchestrateResult> {
  const {
    organizationId,
    messages,
    currentMarkdown,
    contentType,
    selection,
    context = [],
    maxSteps = 1,
    log: inputLog,
    timezone,
    telemetryMetadata,
  } = input;

  const log = deps?.log ?? inputLog;

  const validatedIntegrations = await validateIntegrations(
    organizationId,
    context,
    deps?.integrationFetchers
  );

  const hasGitHub = hasEnabledGitHubIntegration(validatedIntegrations);
  const hasLinear = hasEnabledLinearIntegration(validatedIntegrations);
  const hasIntegrationContext = hasGitHub || hasLinear;

  const lastUserMessage = getLastUserMessage(messages);
  const hasAttachments = lastUserMessageHasNonTextParts(messages);
  const routingDecision = await routeAndSelectModel(
    lastUserMessage,
    hasIntegrationContext,
    log,
    hasAttachments,
    telemetryMetadata
  );

  const isSimpleNoTools =
    routingDecision.complexity === "simple" && !routingDecision.requiresTools;

  const modelWithMemory = createModel(
    organizationId,
    routingDecision.model,
    { disableMemory: isSimpleNoTools },
    log
  );

  const { tools, descriptions } = buildToolSet(
    {
      organizationId,
      currentMarkdown,
      validatedIntegrations,
    },
    {
      resolveContext: deps?.resolveContext,
      resolveLinearContext: deps?.resolveLinearContext,
      skipTools: !routingDecision.requiresTools,
    }
  );

  const repoContext = getRepoContextFromIntegrations(validatedIntegrations);
  const linearContext = getLinearContextFromIntegrations(validatedIntegrations);

  const systemPrompt = isSimpleNoTools
    ? MINIMAL_CHAT_PROMPT
    : getContentEditorChatPrompt({
        selection,
        contentType,
        repoContext,
        linearContext,
        toolDescriptions: descriptions,
        hasGitHubEnabled: hasGitHub,
        hasLinearEnabled: hasLinear,
        timezone,
      });

  const messagesForModel = isSimpleNoTools
    ? trimMessagesForSimpleChat(messages)
    : messages;

  const stream = streamText({
    model: modelWithMemory,
    system: systemPrompt,
    messages: await convertToModelMessages(messagesForModel, {
      ignoreIncompleteToolCalls: true,
    }),
    tools,
    stopWhen: stepCountIs(maxSteps),
    prepareStep: ({ messages: stepMessages }) => ({
      messages: addAnthropicPromptCaching(stepMessages, routingDecision.model),
    }),
    experimental_telemetry: buildExperimentalTelemetry(telemetryMetadata),
    async onFinish({ totalUsage }) {
      await deps?.onUsage?.(totalUsage, routingDecision.model);
    },
    onError({ error }) {
      console.error("[Chat Stream Error]", {
        organizationId,
        model: routingDecision.model,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return { stream, routingDecision };
}

const MINIMAL_CHAT_PROMPT =
  "You are a concise writing assistant inside a content editor. Reply briefly and directly. If the user asks for edits, let them know they can ask you to modify the document and you'll use editing tools on the next turn.";

const SIMPLE_CHAT_HISTORY_LIMIT = 6;

function trimMessagesForSimpleChat(messages: UIMessage[]): UIMessage[] {
  const recent = messages.slice(-SIMPLE_CHAT_HISTORY_LIMIT);
  // Keep the latest message intact so user-submitted attachments still reach
  // the model; only historical turns get stripped to text.
  return recent.map((message, index) => {
    if (!Array.isArray(message.parts) || index === recent.length - 1) {
      return message;
    }
    const textParts = message.parts.filter((part) => part.type === "text");
    if (textParts.length === message.parts.length) {
      return message;
    }
    return { ...message, parts: textParts };
  });
}

function lastUserMessageHasNonTextParts(messages: UIMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message || message.role !== "user") {
      continue;
    }
    if (!Array.isArray(message.parts)) {
      return false;
    }
    return message.parts.some((part) => part.type !== "text");
  }
  return false;
}

function getLastUserMessage(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message) {
      continue;
    }
    if (message.role === "user") {
      const parts = message.parts;
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part.type === "text") {
            return part.text;
          }
        }
      }
    }
  }
  return "";
}
