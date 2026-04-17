import { orchestrateStandaloneChat } from "@notra/ai/orchestration/orchestrate-standalone";
import type { StandaloneChatContextItem } from "@notra/ai/types/standalone-chat";
import { serve } from "@upstash/workflow/nextjs";
import type { UIMessageChunk } from "ai";
import { nanoid } from "nanoid";
import { FEATURES } from "@/constants/features";
import { isAiChatExperimentEnabled } from "@/lib/ai-chat-experiment";
import { autumn } from "@/lib/billing/autumn";
import { calculateTokenCostCents } from "@/lib/billing/token-pricing";
import {
  clearActiveChatStream,
  clearChatAbortFlag,
  getChatStreamChannelName,
  loadChatHistory,
  replaceChatHistory,
} from "@/lib/chat-history";
import { realtime } from "@/lib/realtime";
import {
  getGitHubIntegrationById,
  getGitHubIntegrationsByOrganization,
  getGitHubToolRepositoryContextByIntegrationId,
} from "@/lib/services/github-integration";
import {
  getLinearIntegrationById,
  getLinearIntegrationsByOrganization,
  getLinearToolContextByIntegrationId,
} from "@/lib/services/linear-integration";
import { chatWorkflowPayloadSchema } from "@/schemas/chat";
import type { ChatWorkflowPayload } from "@/types/chat";
import { startChatAbortPolling } from "@/utils/chat-abort-polling.server";

export const { POST } = serve<ChatWorkflowPayload>(async (context) => {
  const parseResult = chatWorkflowPayloadSchema.safeParse(
    context.requestPayload
  );

  if (!parseResult.success) {
    console.error(
      "[Chat Workflow] Invalid payload:",
      parseResult.error.flatten()
    );
    await context.cancel();
    return;
  }

  const {
    requestId,
    organizationId,
    chatId,
    userId,
    userEmail,
    context: standaloneContext,
    useMarkup,
    model,
    enableThinking,
    thinkingLevel,
  } = parseResult.data;

  const aiChatEnabled = await isAiChatExperimentEnabled({
    userId,
    email: userEmail,
    organizationId,
  });

  if (!aiChatEnabled) {
    await context.cancel();
    return;
  }

  const messages = await context.run("load-chat-history", () =>
    loadChatHistory(organizationId, chatId)
  );

  if (messages.length === 0) {
    await context.cancel();
    return;
  }

  const latestMessage = messages.at(-1);
  if (!latestMessage?.id) {
    await context.cancel();
    return;
  }

  const channelName = getChatStreamChannelName(
    organizationId,
    chatId,
    latestMessage.id
  );

  const channel = realtime?.channel(channelName);

  if (!channel) {
    console.error("[Chat Workflow] Realtime not configured for streaming", {
      requestId,
      organizationId,
      chatId,
      channelName,
    });
    await clearActiveChatStream(organizationId, chatId);
    await context.cancel();
    return;
  }

  const abortController = new AbortController();
  let stopAbortPolling: (() => void) | null = null;
  const streamStartedAt = Date.now();
  const timing: { firstChunkAt: number | null } = { firstChunkAt: null };
  const usageSnapshot: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } = {};

  try {
    stopAbortPolling = startChatAbortPolling({
      organizationId,
      chatId,
      streamId: latestMessage.id,
      onAbort: () => abortController.abort(),
    });
    const { stream, routingDecision } = await orchestrateStandaloneChat(
      {
        organizationId,
        messages,
        context: standaloneContext as StandaloneChatContextItem[],
        maxSteps: 5,
        abortSignal: abortController.signal,
        requestedModel: model,
        enableThinking,
        thinkingLevel,
      },
      {
        integrationFetchers: {
          getGitHubIntegrationById,
          getLinearIntegrationById,
          listGitHubIntegrationsByOrganization:
            getGitHubIntegrationsByOrganization,
          listLinearIntegrationsByOrganization:
            getLinearIntegrationsByOrganization,
        },
        resolveContext: getGitHubToolRepositoryContextByIntegrationId,
        resolveLinearContext: getLinearToolContextByIntegrationId,
        onFirstChunk() {
          if (timing.firstChunkAt === null) {
            timing.firstChunkAt = Date.now();
          }
        },
        async onUsage(usage, modelId) {
          usageSnapshot.inputTokens = usage.inputTokens ?? 0;
          usageSnapshot.outputTokens = usage.outputTokens ?? 0;
          usageSnapshot.totalTokens = usage.totalTokens ?? 0;

          if (!autumn) {
            return;
          }

          const costCents = calculateTokenCostCents(
            {
              inputTokens: usage.inputTokens ?? 0,
              outputTokens: usage.outputTokens ?? 0,
              totalTokens: usage.totalTokens ?? 0,
              cacheReadTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
              cacheWriteTokens: usage.inputTokenDetails?.cacheWriteTokens ?? 0,
            },
            modelId,
            useMarkup
          );

          try {
            await autumn.track({
              customerId: organizationId,
              featureId: FEATURES.AI_CREDITS,
              value: costCents,
              properties: {
                source: "standalone_chat",
                model: modelId,
                input_tokens: usage.inputTokens ?? 0,
                output_tokens: usage.outputTokens ?? 0,
                cache_read_tokens:
                  usage.inputTokenDetails?.cacheReadTokens ?? 0,
                cache_write_tokens:
                  usage.inputTokenDetails?.cacheWriteTokens ?? 0,
                total_tokens: usage.totalTokens ?? 0,
                cost_cents: costCents,
              },
            });
          } catch (trackError) {
            console.error("[Autumn] Track error after standalone chat:", {
              requestId,
              customerId: organizationId,
              error: trackError,
            });
          }
        },
      }
    );

    console.log("[Chat Workflow] Routing decision:", {
      requestId,
      chatId,
      decision: routingDecision,
    });

    const uiStream = stream.toUIMessageStream({
      originalMessages: messages,
      generateMessageId: nanoid,
      sendReasoning: enableThinking !== false,
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return {
            model: routingDecision.model,
            thinkingLevel: enableThinking === false ? "off" : thinkingLevel,
            createdAt: streamStartedAt,
          };
        }

        if (part.type === "finish") {
          const finishedAt = Date.now();
          const ttftMs =
            timing.firstChunkAt !== null
              ? timing.firstChunkAt - streamStartedAt
              : undefined;
          const generationDurationMs =
            timing.firstChunkAt !== null
              ? finishedAt - timing.firstChunkAt
              : undefined;
          const outputTokens = usageSnapshot.outputTokens ?? 0;
          const tokensPerSecond =
            generationDurationMs && generationDurationMs > 0 && outputTokens > 0
              ? (outputTokens / generationDurationMs) * 1000
              : undefined;

          return {
            inputTokens: usageSnapshot.inputTokens,
            outputTokens: usageSnapshot.outputTokens,
            totalTokens: usageSnapshot.totalTokens,
            ttftMs,
            generationDurationMs,
            tokensPerSecond,
          };
        }

        return;
      },
      onFinish: async ({ messages: responseMessages }) => {
        try {
          await replaceChatHistory(organizationId, chatId, responseMessages);
        } finally {
          await clearActiveChatStream(organizationId, chatId);
        }
      },
      onError: (error) => {
        console.error("[Chat Workflow] Stream error:", { requestId, error });
        if (error instanceof Error) {
          return error.message;
        }
        return "An error occurred while processing your request.";
      },
    });

    for await (const chunk of uiStream) {
      if (abortController.signal.aborted) {
        break;
      }
      await channel.emit("ai.chunk", chunk as UIMessageChunk);
    }

    if (abortController.signal.aborted) {
      await channel.emit("ai.chunk", {
        type: "abort",
        reason: "user-stopped",
      });
      await channel.emit("ai.chunk", {
        type: "finish",
        finishReason: "stop",
      });
    }
  } catch (error) {
    const isAbort =
      abortController.signal.aborted ||
      (error instanceof Error && error.name === "AbortError");

    if (isAbort) {
      console.log("[Chat Workflow] Aborted by user:", { requestId, chatId });
      await channel.emit("ai.chunk", {
        type: "abort",
        reason: "user-stopped",
      });
      await channel.emit("ai.chunk", {
        type: "finish",
        finishReason: "stop",
      });
    } else {
      console.error("[Chat Workflow] Error:", {
        requestId,
        chatId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (channel) {
        await channel.emit("ai.chunk", {
          type: "error",
          errorText:
            error instanceof Error
              ? error.message
              : "An error occurred while processing your request.",
        });
        await channel.emit("ai.chunk", {
          type: "finish",
          finishReason: "error",
        });
      }
    }

    await clearActiveChatStream(organizationId, chatId);
    if (!isAbort) {
      throw error;
    }
  } finally {
    stopAbortPolling?.();
    await clearChatAbortFlag(organizationId, chatId, latestMessage.id).catch(
      () => undefined
    );
  }
});
