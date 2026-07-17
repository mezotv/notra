import { calculateAiCreditCostCents } from "@notra/ai/billing/ai-credit-cost";
import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { startChatAbortPolling } from "@notra/ai/chat/abort-polling";
import {
  claimChatWorkflowRequest,
  clearActiveChatStream,
  clearChatAbortFlag,
  getChatStreamChannelName,
  loadChatHistory,
  replaceChatHistory,
} from "@notra/ai/chat/history";
import {
  getGitHubIntegrationById,
  getGitHubIntegrationsByOrganization,
  getGitHubToolRepositoryContextByIntegrationId,
} from "@notra/ai/integrations/github";
import {
  getLinearIntegrationById,
  getLinearIntegrationsByOrganization,
  getLinearToolContextByIntegrationId,
} from "@notra/ai/integrations/linear";
import { orchestrateStandaloneChat } from "@notra/ai/orchestration/orchestrate-standalone";
import { realtime } from "@notra/ai/realtime";
import { chatWorkflowPayloadSchema } from "@notra/ai/schemas/chat";
import type {
  ChatUsageSnapshot,
  ChatWorkflowPayload,
} from "@notra/ai/types/chat";
import type { StandaloneChatContextItem } from "@notra/ai/types/standalone-chat";
import { buildChatFinishMetadata } from "@notra/ai/utils/chat";
import { verifyChatWorkflowPayload } from "@notra/ai/utils/chat-workflow-auth";
import { serve } from "@upstash/workflow/nextjs";
import type { UIMessageChunk } from "ai";
import { nanoid } from "nanoid";

export const maxDuration = 300;

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

  const workflowSecret = process.env.QSTASH_TOKEN;
  if (
    !workflowSecret ||
    !verifyChatWorkflowPayload(parseResult.data, workflowSecret)
  ) {
    console.error("[Chat Workflow] Payload authorization failed");
    await context.cancel();
    return;
  }

  const {
    requestId,
    organizationId,
    chatId,
    userId,
    context: standaloneContext,
    useMarkup,
    model,
    enableThinking,
    thinkingLevel,
    timezone,
  } = parseResult.data;

  const requestClaimed = await context.run("claim-chat-workflow-request", () =>
    claimChatWorkflowRequest(requestId)
  );
  if (!requestClaimed) {
    console.error("[Chat Workflow] Duplicate or unclaimable request", {
      requestId,
      organizationId,
      chatId,
    });
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
    await clearActiveChatStream(organizationId, chatId, latestMessage.id);
    await context.cancel();
    return;
  }

  const creditCheck = await context.run(
    "recheck-ai-credit-balance",
    async () => {
      if (!autumn) {
        return { allowed: true, unavailable: false };
      }

      try {
        const result = await autumn.check({
          customerId: organizationId,
          featureId: FEATURES.AI_CREDITS,
          requiredBalance: 1,
        });
        return { allowed: Boolean(result?.allowed), unavailable: false };
      } catch (error) {
        console.error("[Chat Workflow] AI credit check failed", {
          requestId,
          organizationId,
          chatId,
          error: error instanceof Error ? error.message : String(error),
        });
        return { allowed: false, unavailable: true };
      }
    }
  );

  if (!creditCheck.allowed) {
    console.warn("[Chat Workflow] AI credit check rejected generation", {
      requestId,
      organizationId,
      chatId,
      unavailable: creditCheck.unavailable,
    });
    try {
      await channel.emit("ai.chunk", {
        type: "error",
        errorText: creditCheck.unavailable
          ? "Unable to verify usage limits. Please try again."
          : "Usage limit reached.",
      });
      await channel.emit("ai.chunk", {
        type: "finish",
        finishReason: "error",
      });
    } catch (error) {
      console.error("[Chat Workflow] Failed to emit billing error", {
        requestId,
        organizationId,
        chatId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await clearActiveChatStream(organizationId, chatId, latestMessage.id);
    }
    await context.cancel();
    return;
  }

  const abortController = new AbortController();
  let stopAbortPolling: (() => void) | null = null;
  const streamStartedAt = Date.now();
  const timing: { firstChunkAt: number | null } = { firstChunkAt: null };
  const usageSnapshot: ChatUsageSnapshot = {};

  let buffer: UIMessageChunk[] = [];
  let flushPromise: Promise<void> | null = null;

  const flushBuffer = async () => {
    while (buffer.length > 0) {
      const batch = buffer;
      buffer = [];
      await channel.emit("ai.chunk", batch as never);
    }
  };

  const scheduleFlush = () => {
    if (flushPromise) {
      return;
    }
    flushPromise = flushBuffer().finally(() => {
      flushPromise = null;
    });
  };

  const drainPendingFlushes = async () => {
    if (flushPromise) {
      await flushPromise;
    }
    await flushBuffer();
  };

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
        chatId,
        userId,
        messages,
        context: standaloneContext as StandaloneChatContextItem[],
        maxSteps: 50,
        abortSignal: abortController.signal,
        requestedModel: model,
        enableThinking,
        thinkingLevel,
        timezone,
        useMarkup,
        telemetryMetadata: {
          chatId,
          feature: "standalone_chat",
          organizationId,
          routeName: "/api/workflows/chat",
          "tcc.conversational": "true",
          "tcc.sessionId": chatId,
          userId: parseResult.data.userId,
        },
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
          usageSnapshot.cacheReadTokens =
            usage.inputTokenDetails?.cacheReadTokens ?? 0;
          usageSnapshot.cacheWriteTokens =
            usage.inputTokenDetails?.cacheWriteTokens ?? 0;

          if (!autumn) {
            return;
          }

          const cost = calculateAiCreditCostCents(
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
              value: cost.costCents,
              properties: {
                source: "standalone_chat",
                model: modelId,
                billing_basis: cost.billingBasis,
                input_tokens: usage.inputTokens ?? 0,
                output_tokens: usage.outputTokens ?? 0,
                cache_read_tokens:
                  usage.inputTokenDetails?.cacheReadTokens ?? 0,
                cache_write_tokens:
                  usage.inputTokenDetails?.cacheWriteTokens ?? 0,
                total_tokens: usage.totalTokens ?? 0,
                cost_cents: cost.costCents,
                token_cost_cents: cost.tokenCostCents,
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
        const effectiveThinkingLevel =
          enableThinking === false
            ? "off"
            : (routingDecision.thinkingLevel ?? thinkingLevel);

        if (part.type === "start") {
          return {
            model: routingDecision.model,
            requestedModel: model ?? "auto",
            thinkingLevel: effectiveThinkingLevel,
            requestedThinkingLevel: thinkingLevel,
            createdAt: streamStartedAt,
          };
        }

        if (part.type === "finish") {
          return buildChatFinishMetadata({
            streamStartedAt,
            firstChunkAt: timing.firstChunkAt,
            finishedAt: Date.now(),
            partUsage: part.totalUsage,
            usageSnapshot,
            model: routingDecision.model,
            requestedModel: model ?? "auto",
            thinkingLevel: effectiveThinkingLevel,
            requestedThinkingLevel: thinkingLevel,
          });
        }

        return;
      },
      onFinish: async ({ messages: responseMessages }) => {
        try {
          const saved = await replaceChatHistory(
            organizationId,
            chatId,
            responseMessages,
            undefined,
            latestMessage.id
          );
          if (!saved) {
            console.warn(
              "[Chat Workflow] Skipped saving response: chat was deleted",
              { requestId, organizationId, chatId }
            );
          }
        } finally {
          await clearActiveChatStream(organizationId, chatId, latestMessage.id);
        }
      },
      onError: (error) => {
        console.error("[Chat Workflow] Stream error:", { requestId, error });
        return "An error occurred while processing your request.";
      },
    });

    for await (const chunk of uiStream) {
      if (abortController.signal.aborted) {
        break;
      }
      buffer.push(chunk as UIMessageChunk);
      scheduleFlush();
    }

    if (abortController.signal.aborted) {
      buffer.push(
        { type: "abort", reason: "user-stopped" },
        { type: "finish", finishReason: "stop" }
      );
      scheduleFlush();
    }

    await drainPendingFlushes();
  } catch (error) {
    const isAbort =
      abortController.signal.aborted ||
      (error instanceof Error && error.name === "AbortError");

    await drainPendingFlushes();

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
          errorText: "An error occurred while processing your request.",
        });
        await channel.emit("ai.chunk", {
          type: "finish",
          finishReason: "error",
        });
      }
    }

    await clearActiveChatStream(organizationId, chatId, latestMessage.id);
  } finally {
    stopAbortPolling?.();
    await clearChatAbortFlag(organizationId, chatId, latestMessage.id).catch(
      () => undefined
    );
  }
});
