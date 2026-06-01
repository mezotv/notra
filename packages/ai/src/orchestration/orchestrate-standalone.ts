import { createModel } from "@notra/ai/model";
import { getStandaloneChatPrompt } from "@notra/ai/prompts/standalone-chat";
import {
  createCreatePostTool,
  createUpdatePostTool,
  createViewPostTool,
} from "@notra/ai/tools/post";
import type {
  AutoThinkingLevel,
  IntegrationFetchers,
  StreamProviderOptions,
  ValidatedIntegration,
} from "@notra/ai/types/orchestration";
import type { PostToolsResult } from "@notra/ai/types/post-tools";
import type {
  OrchestrateResult,
  StandaloneChatContextItem,
  StandaloneChatDeps,
  StandaloneChatInput,
} from "@notra/ai/types/standalone-chat";
import { buildExperimentalTelemetry } from "@notra/ai/utils/tcc";
import {
  convertToModelMessages,
  isToolUIPart,
  smoothStream,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import {
  hasEnabledGitHubIntegration,
  hasEnabledLinearIntegration,
} from "./integration-validator";
import { isTrivialMessage, routeMessage, selectAutoModel } from "./router";
import {
  buildStandaloneToolSet,
  getLinearContextFromIntegrations,
  getRepoContextFromIntegrations,
} from "./standalone-tool-registry";

const SKILLS_MENTION_REGEX = /\bskills?\b/i;

const TRIVIAL_HISTORY_LIMIT = 6;
const MINIMAL_STANDALONE_PROMPT =
  "You are Notra, an AI assistant for content teams. Reply briefly and warmly. Do not call tools on this turn.";

export async function orchestrateStandaloneChat(
  input: StandaloneChatInput,
  deps?: StandaloneChatDeps
): Promise<OrchestrateResult> {
  const {
    organizationId,
    chatId,
    userId,
    messages,
    context = [],
    maxSteps = 5,
    log: inputLog,
    requestedModel,
    enableThinking = true,
    thinkingLevel = "medium",
    abortSignal,
    timezone,
    telemetryMetadata,
  } = input;

  const log = deps?.log ?? inputLog;

  const validatedIntegrations =
    deps?.preValidatedIntegrations ??
    (await validateStandaloneIntegrations(
      organizationId,
      context,
      deps?.integrationFetchers
    ));

  const hasGitHub = hasEnabledGitHubIntegration(validatedIntegrations);
  const hasLinear = hasEnabledLinearIntegration(validatedIntegrations);

  const lastUserMessage = getLastUserMessage(messages);
  // Never short-circuit when the user attached files — the fast path strips
  // tools and trims history, which would drop image/file parts and force a
  // blind reply to "ok" + image.
  const hasNonTextPartsOnLatestTurn = lastUserMessageHasNonTextParts(messages);
  const isTrivial =
    !hasNonTextPartsOnLatestTurn && isTrivialMessage(lastUserMessage);
  const mentionsSkills = SKILLS_MENTION_REGEX.test(lastUserMessage);
  const isAuto = requestedModel === undefined || requestedModel === "auto";

  let selectedModel: string;
  let autoThinkingLevel: AutoThinkingLevel | undefined;
  let decisionReasoning: string;
  let decisionComplexity: "simple" | "complex" = isTrivial
    ? "simple"
    : "complex";
  let decisionRequiresTools = !isTrivial;

  if (isAuto) {
    const decision = await routeMessage(
      lastUserMessage,
      hasGitHub || hasLinear,
      log,
      hasNonTextPartsOnLatestTurn,
      telemetryMetadata
    );
    const auto = selectAutoModel(decision);
    selectedModel = auto.model;
    autoThinkingLevel = auto.thinkingLevel;
    decisionComplexity = decision.complexity;
    decisionRequiresTools = decision.requiresTools;
    decisionReasoning = `auto → ${auto.model}: ${decision.reasoning}`;
  } else {
    selectedModel = requestedModel;
    decisionReasoning = isTrivial
      ? "Trivial greeting/acknowledgement — minimal prompt, no tools, no thinking"
      : "User selected model explicitly";
  }

  if (mentionsSkills && !decisionRequiresTools) {
    decisionRequiresTools = true;
    decisionReasoning = `${decisionReasoning} (forced tools: message mentions skills)`;
  }

  const routingDecision = {
    model: selectedModel,
    complexity: decisionComplexity,
    requiresTools: decisionRequiresTools,
    reasoning: decisionReasoning,
    thinkingLevel: autoThinkingLevel,
  };

  const isSimpleNoTools =
    routingDecision.complexity === "simple" && !routingDecision.requiresTools;

  const modelWithMemory = createModel(
    organizationId,
    routingDecision.model,
    { disableMemory: isSimpleNoTools },
    log
  );

  const postResult: PostToolsResult = {};

  const { tools, descriptions } = isSimpleNoTools
    ? { tools: {}, descriptions: [] as string[] }
    : buildStandaloneToolSet(
        {
          organizationId,
          chatId,
          userId,
          validatedIntegrations,
          postResult,
        },
        {
          resolveContext: deps?.resolveContext,
          resolveLinearContext: deps?.resolveLinearContext,
        }
      );

  const repoContext = getRepoContextFromIntegrations(validatedIntegrations);
  const linearContext = getLinearContextFromIntegrations(validatedIntegrations);

  const systemPrompt = isSimpleNoTools
    ? MINIMAL_STANDALONE_PROMPT
    : getStandaloneChatPrompt({
        repoContext,
        linearContext,
        toolDescriptions: descriptions,
        hasGitHubEnabled: hasGitHub,
        hasLinearEnabled: hasLinear,
        timezone,
      });

  const effectiveThinkingLevel = autoThinkingLevel ?? thinkingLevel;
  const effectiveEnableThinking =
    enableThinking && (autoThinkingLevel ? autoThinkingLevel !== "off" : true);

  const providerOptions = isSimpleNoTools
    ? undefined
    : getThinkingProviderOptions(
        routingDecision.model,
        effectiveEnableThinking,
        effectiveThinkingLevel
      );

  const messagesForModel = stripIncompleteToolParts(
    isSimpleNoTools ? trimTrivialHistory(messages) : messages
  );

  const modelMessages = await convertToModelMessages(messagesForModel, {
    ignoreIncompleteToolCalls: true,
  });

  let firstChunkFired = false;
  const stream = streamText({
    model: modelWithMemory,
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(isSimpleNoTools ? 1 : maxSteps),
    experimental_transform: smoothStream(),
    providerOptions,
    abortSignal,
    experimental_telemetry: buildExperimentalTelemetry(telemetryMetadata),
    onChunk({ chunk }) {
      if (firstChunkFired) {
        return;
      }
      if (chunk.type === "text-delta" || chunk.type === "reasoning-delta") {
        firstChunkFired = true;
        deps?.onFirstChunk?.();
      }
    },
    onAbort({ steps }) {
      console.log("[Standalone Chat Stream Aborted]", {
        organizationId,
        model: routingDecision.model,
        completedSteps: steps.length,
      });
    },
    async onFinish({ totalUsage }) {
      await deps?.onUsage?.(totalUsage, routingDecision.model);
    },
    onError({ error }) {
      console.error("[Standalone Chat Stream Error]", {
        organizationId,
        model: routingDecision.model,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return { stream, routingDecision };
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
    if (!message || message.role !== "user") {
      continue;
    }
    const parts = message.parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      if (part.type === "text") {
        return part.text;
      }
    }
  }
  return "";
}

// Tool-part states that are "complete" from the user's perspective and must
// survive history trimming before `convertToModelMessages` runs. Missing
// `approval-responded` here previously dropped the user's approval payload,
// leaving the conversation ending on an assistant turn — which Bedrock-routed
// Anthropic (Sonnet 4.6 / Opus 4.7 via AI Gateway) rejects with
// "This model does not support assistant message prefill".
const TERMINAL_TOOL_STATES = new Set([
  "output-available",
  "output-error",
  "output-denied",
  "approval-responded",
]);

const STRIP_TAIL_SCAN_DEPTH = 2;

function stripIncompleteToolParts(messages: UIMessage[]): UIMessage[] {
  const scanFrom = Math.max(0, messages.length - STRIP_TAIL_SCAN_DEPTH);
  let hasIncomplete = false;
  for (let index = scanFrom; index < messages.length; index += 1) {
    const message = messages[index];
    if (!(message && Array.isArray(message.parts))) {
      continue;
    }
    if (
      message.parts.some(
        (part) => isToolUIPart(part) && !TERMINAL_TOOL_STATES.has(part.state)
      )
    ) {
      hasIncomplete = true;
      break;
    }
  }
  if (!hasIncomplete) {
    return messages;
  }
  return messages.map((message, index) => {
    if (index < scanFrom || !Array.isArray(message.parts)) {
      return message;
    }
    const filtered = message.parts.filter(
      (part) => !isToolUIPart(part) || TERMINAL_TOOL_STATES.has(part.state)
    );
    if (filtered.length === message.parts.length) {
      return message;
    }
    return { ...message, parts: filtered };
  });
}

function trimTrivialHistory(messages: UIMessage[]): UIMessage[] {
  const recent = messages.slice(-TRIVIAL_HISTORY_LIMIT);
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

function getThinkingProviderOptions(
  modelId: string,
  enableThinking: boolean,
  thinkingLevel: "off" | "low" | "medium" | "high"
): StreamProviderOptions | undefined {
  if (!enableThinking || thinkingLevel === "off") {
    return undefined;
  }

  if (modelId.startsWith("anthropic/")) {
    if (usesAdaptiveThinking(modelId)) {
      return {
        anthropic: {
          thinking: { type: "adaptive" },
          output_config: { effort: thinkingLevel },
        },
      } satisfies StreamProviderOptions;
    }

    return {
      anthropic: {
        thinking: {
          type: "enabled",
          budgetTokens: getAnthropicThinkingBudget(thinkingLevel),
        },
      },
    } satisfies StreamProviderOptions;
  }

  if (modelId.startsWith("openai/")) {
    return {
      openai: {
        reasoningEffort: thinkingLevel,
      },
    } satisfies StreamProviderOptions;
  }

  return undefined;
}

function usesAdaptiveThinking(modelId: string): boolean {
  return modelId === "anthropic/claude-opus-4.7";
}

function getAnthropicThinkingBudget(
  thinkingLevel: "off" | "low" | "medium" | "high"
): number {
  switch (thinkingLevel) {
    case "low":
      return 1024;
    case "high":
      return 8192;
    case "medium":
      return 4096;
    default:
      return 0;
  }
}

async function validateStandaloneIntegrations(
  organizationId: string,
  contextItems: StandaloneChatContextItem[],
  fetchers?: IntegrationFetchers
): Promise<ValidatedIntegration[]> {
  if (!fetchers) {
    return [];
  }

  const [githubFromOrganization, linearFromOrganization] = await Promise.all([
    fetchers.listGitHubIntegrationsByOrganization !== undefined
      ? getEnabledGitHubIntegrations(
          organizationId,
          fetchers.listGitHubIntegrationsByOrganization
        )
      : Promise.resolve<ValidatedIntegration[]>([]),
    fetchers.listLinearIntegrationsByOrganization !== undefined
      ? getEnabledLinearIntegrations(
          organizationId,
          fetchers.listLinearIntegrationsByOrganization
        )
      : Promise.resolve<ValidatedIntegration[]>([]),
  ]);

  if (githubFromOrganization.length > 0 || linearFromOrganization.length > 0) {
    return [...githubFromOrganization, ...linearFromOrganization];
  }

  if (!contextItems.length) {
    return [];
  }

  const validatedIntegrations: ValidatedIntegration[] = [];

  const githubItems = contextItems.filter((c) => c.type === "github-repo");
  const linearItems = contextItems.filter((c) => c.type === "linear-team");

  if (githubItems.length > 0 && fetchers.getGitHubIntegrationById) {
    const integrationIds = [
      ...new Set(githubItems.map((c) => c.integrationId)),
    ];

    for (const integrationId of integrationIds) {
      try {
        const integration =
          await fetchers.getGitHubIntegrationById(integrationId);

        if (
          !integration ||
          integration.organizationId !== organizationId ||
          !integration.enabled
        ) {
          continue;
        }

        const contextRepos = githubItems
          .filter((c) => c.integrationId === integrationId)
          .map((c) => ({ owner: c.owner, repo: c.repo }));

        const enabledRepos = integration.repositories
          .filter((r) => {
            if (!r.enabled) {
              return false;
            }
            return contextRepos.some(
              (cr) => cr.owner === r.owner && cr.repo === r.repo
            );
          })
          .map((r) => ({
            id: r.id,
            owner: r.owner,
            repo: r.repo,
            defaultBranch: r.defaultBranch ?? null,
            enabled: r.enabled,
          }));

        if (enabledRepos.length === 0) {
          continue;
        }

        validatedIntegrations.push({
          id: integration.id,
          type: "github",
          enabled: integration.enabled,
          displayName: integration.displayName,
          organizationId: integration.organizationId,
          repositories: enabledRepos,
        });
      } catch (error) {
        console.error(
          `[Standalone Chat] Error validating GitHub integration ${integrationId}:`,
          error
        );
      }
    }
  }

  if (linearItems.length > 0 && fetchers.getLinearIntegrationById) {
    const integrationIds = [
      ...new Set(linearItems.map((c) => c.integrationId)),
    ];

    for (const integrationId of integrationIds) {
      try {
        const integration =
          await fetchers.getLinearIntegrationById(integrationId);

        if (
          !integration ||
          integration.organizationId !== organizationId ||
          !integration.enabled
        ) {
          continue;
        }

        validatedIntegrations.push({
          id: integration.id,
          type: "linear",
          enabled: integration.enabled,
          displayName: integration.displayName,
          organizationId: integration.organizationId,
          linearTeamId: integration.linearTeamId,
          linearTeamName: integration.linearTeamName,
        });
      } catch (error) {
        console.error(
          `[Standalone Chat] Error validating Linear integration ${integrationId}:`,
          error
        );
      }
    }
  }

  return validatedIntegrations;
}

async function getEnabledGitHubIntegrations(
  organizationId: string,
  listGitHubIntegrationsByOrganization: NonNullable<
    IntegrationFetchers["listGitHubIntegrationsByOrganization"]
  >
): Promise<ValidatedIntegration[]> {
  try {
    const integrations =
      await listGitHubIntegrationsByOrganization(organizationId);

    return integrations
      .filter((integration) => integration.enabled)
      .map((integration) => ({
        id: integration.id,
        type: "github" as const,
        enabled: integration.enabled,
        displayName: integration.displayName,
        organizationId: integration.organizationId,
        repositories: integration.repositories
          .filter((repository) => repository.enabled)
          .map((repository) => ({
            id: repository.id,
            owner: repository.owner,
            repo: repository.repo,
            defaultBranch: repository.defaultBranch ?? null,
            enabled: repository.enabled,
          })),
      }))
      .filter((integration) => integration.repositories.length > 0);
  } catch (error) {
    console.error(
      `[Standalone Chat] Error listing GitHub integrations for org ${organizationId}:`,
      error
    );
    return [];
  }
}

async function getEnabledLinearIntegrations(
  organizationId: string,
  listLinearIntegrationsByOrganization: NonNullable<
    IntegrationFetchers["listLinearIntegrationsByOrganization"]
  >
): Promise<ValidatedIntegration[]> {
  try {
    const integrations =
      await listLinearIntegrationsByOrganization(organizationId);

    return integrations
      .filter((integration) => integration.enabled)
      .map((integration) => ({
        id: integration.id,
        type: "linear" as const,
        enabled: integration.enabled,
        displayName: integration.displayName,
        organizationId: integration.organizationId,
        linearTeamId: integration.linearTeamId,
        linearTeamName: integration.linearTeamName,
      }));
  } catch (error) {
    console.error(
      `[Standalone Chat] Error listing Linear integrations for org ${organizationId}:`,
      error
    );
    return [];
  }
}
