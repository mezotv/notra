import { createModel } from "@notra/ai/model";
import { getStandaloneChatPrompt } from "@notra/ai/prompts/standalone-chat";
import {
  createCreatePostTool,
  createUpdatePostTool,
  createViewPostTool,
} from "@notra/ai/tools/post";
import type {
  IntegrationFetchers,
  ValidatedIntegration,
} from "@notra/ai/types/orchestration";
import type { PostToolsResult } from "@notra/ai/types/post-tools";
import type {
  OrchestrateResult,
  StandaloneChatContextItem,
  StandaloneChatDeps,
  StandaloneChatInput,
} from "@notra/ai/types/standalone-chat";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import {
  hasEnabledGitHubIntegration,
  hasEnabledLinearIntegration,
} from "./integration-validator";
import {
  buildStandaloneToolSet,
  getLinearContextFromIntegrations,
  getRepoContextFromIntegrations,
} from "./standalone-tool-registry";

const DEFAULT_STANDALONE_CHAT_MODEL = "anthropic/claude-sonnet-4-6";

export async function orchestrateStandaloneChat(
  input: StandaloneChatInput,
  deps?: StandaloneChatDeps
): Promise<OrchestrateResult> {
  const {
    organizationId,
    messages,
    context = [],
    maxSteps = 5,
    log: inputLog,
    requestedModel,
    enableThinking = true,
    thinkingLevel = "medium",
    abortSignal,
  } = input;

  const log = deps?.log ?? inputLog;

  const validatedIntegrations = await validateStandaloneIntegrations(
    organizationId,
    context,
    deps?.integrationFetchers
  );

  const hasGitHub = hasEnabledGitHubIntegration(validatedIntegrations);
  const hasLinear = hasEnabledLinearIntegration(validatedIntegrations);
  const selectedModel = requestedModel ?? DEFAULT_STANDALONE_CHAT_MODEL;
  const routingDecision = {
    model: selectedModel,
    complexity: "complex" as const,
    requiresTools: true,
    reasoning: requestedModel
      ? "User selected model explicitly"
      : `Using standalone chat default model: ${DEFAULT_STANDALONE_CHAT_MODEL}`,
  };

  const modelWithMemory = createModel(
    organizationId,
    routingDecision.model,
    undefined,
    log
  );

  const postResult: PostToolsResult = {};

  const { tools, descriptions } = buildStandaloneToolSet(
    {
      organizationId,
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

  const systemPrompt = getStandaloneChatPrompt({
    repoContext,
    linearContext,
    toolDescriptions: descriptions,
    hasGitHubEnabled: hasGitHub,
    hasLinearEnabled: hasLinear,
  });

  const providerOptions = getThinkingProviderOptions(
    routingDecision.model,
    enableThinking,
    thinkingLevel
  );

  let firstChunkFired = false;
  const stream = streamText({
    model: modelWithMemory,
    system: systemPrompt,
    messages: await convertToModelMessages(messages, {
      ignoreIncompleteToolCalls: true,
    }),
    tools,
    stopWhen: stepCountIs(maxSteps),
    experimental_transform: smoothStream(),
    providerOptions,
    abortSignal,
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

type StreamProviderOptions = NonNullable<
  Parameters<typeof streamText>[0]["providerOptions"]
>;

function getThinkingProviderOptions(
  modelId: string,
  enableThinking: boolean,
  thinkingLevel: "off" | "low" | "medium" | "high"
): StreamProviderOptions | undefined {
  if (!enableThinking || thinkingLevel === "off") {
    return undefined;
  }

  if (modelId.startsWith("anthropic/")) {
    return {
      anthropic: {
        thinking: {
          type: "enabled" as const,
          budgetTokens: getAnthropicThinkingBudget(thinkingLevel),
        },
      },
    } as StreamProviderOptions;
  }

  if (modelId.startsWith("openai/")) {
    return {
      openai: {
        reasoningEffort: thinkingLevel,
      },
    } as StreamProviderOptions;
  }

  return undefined;
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

  const githubFromOrganization =
    fetchers.listGitHubIntegrationsByOrganization !== undefined
      ? await getEnabledGitHubIntegrations(
          organizationId,
          fetchers.listGitHubIntegrationsByOrganization
        )
      : [];

  const linearFromOrganization =
    fetchers.listLinearIntegrationsByOrganization !== undefined
      ? await getEnabledLinearIntegrations(
          organizationId,
          fetchers.listLinearIntegrationsByOrganization
        )
      : [];

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
