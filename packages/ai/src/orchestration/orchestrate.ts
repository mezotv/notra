import { createModel } from "@notra/ai/model";
import { getContentEditorChatPrompt } from "@notra/ai/prompts/content-editor";
import { getAISDKTelemetry } from "@notra/ai/telemetry";
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
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
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
  } = input;

  const validatedIntegrations = await validateIntegrations(
    organizationId,
    context,
    deps?.integrationFetchers
  );

  const hasGitHub = hasEnabledGitHubIntegration(validatedIntegrations);
  const hasLinear = hasEnabledLinearIntegration(validatedIntegrations);
  const hasDataSources = hasGitHub || hasLinear;

  const lastUserMessage = getLastUserMessage(messages);
  const routingDecision = await routeAndSelectModel(
    lastUserMessage,
    hasDataSources
  );

  console.log("[Chat Routing]", {
    model: routingDecision.model,
    complexity: routingDecision.complexity,
    requiresTools: routingDecision.requiresTools,
    reasoning: routingDecision.reasoning,
    hasGitHub,
    hasLinear,
  });

  const modelWithMemory = createModel(organizationId, routingDecision.model);

  const { tools, descriptions } = buildToolSet(
    {
      organizationId,
      currentMarkdown,
      validatedIntegrations,
    },
    {
      resolveContext: deps?.resolveContext,
      resolveLinearContext: deps?.resolveLinearContext,
    }
  );

  const repoContext = getRepoContextFromIntegrations(validatedIntegrations);
  const linearContext = getLinearContextFromIntegrations(validatedIntegrations);

  const systemPrompt = getContentEditorChatPrompt({
    selection,
    contentType,
    repoContext,
    linearContext,
    toolDescriptions: descriptions,
    hasGitHubEnabled: hasGitHub,
    hasLinearEnabled: hasLinear,
  });

  const stream = streamText({
    model: modelWithMemory,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(maxSteps),
    experimental_telemetry: await getAISDKTelemetry("orchestrateChat", {
      organizationId,
      metadata: {
        agent: "chat",
        feature: "content_editor",
      },
    }),
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
