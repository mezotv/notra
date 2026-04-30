import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { calculateTokenCostCents } from "@notra/ai/billing/token-pricing";
import { startChatAbortPolling } from "@notra/ai/chat/abort-polling";
import {
  clearActiveChatStream,
  clearChatAbortFlag,
  replaceChatHistory,
} from "@notra/ai/chat/history";
import { getGitHubToolRepositoryContextByIntegrationId } from "@notra/ai/integrations/github";
import { getLinearToolContextByIntegrationId } from "@notra/ai/integrations/linear";
import { orchestrateStandaloneChat } from "@notra/ai/orchestration/orchestrate-standalone";
import type { ChatUsageSnapshot } from "@notra/ai/types/chat";
import { buildChatFinishMetadata } from "@notra/ai/utils/chat";
import { nanoid } from "nanoid";
import type { DirectStandaloneChatArgs } from "../../types/chats";

export async function createDirectStandaloneChatResponse({
  organizationId,
  chatId,
  messages,
  context,
  validatedIntegrations,
  useMarkup,
  requestId,
  log,
  model,
  enableThinking,
  thinkingLevel,
  timezone,
  abortSignal,
}: DirectStandaloneChatArgs): Promise<Response> {
  const autumnClient = autumn;
  const streamId = messages.at(-1)?.id;

  if (!streamId) {
    throw new Error("Latest message must include an id");
  }

  const redisAbortController = new AbortController();
  const stopAbortPolling = startChatAbortPolling({
    organizationId,
    chatId,
    streamId,
    onAbort: () => redisAbortController.abort(),
  });

  const onRequestAbort = () => redisAbortController.abort();
  abortSignal?.addEventListener("abort", onRequestAbort, { once: true });

  const combinedAbortSignal = abortSignal
    ? AbortSignal.any([abortSignal, redisAbortController.signal])
    : redisAbortController.signal;

  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    stopAbortPolling();
    abortSignal?.removeEventListener("abort", onRequestAbort);
    await Promise.allSettled([
      clearChatAbortFlag(organizationId, chatId, streamId),
      clearActiveChatStream(organizationId, chatId),
    ]);
  };

  const streamStartedAt = Date.now();
  let firstChunkAt: number | null = null;
  const usageSnapshot: ChatUsageSnapshot = {};

  try {
    const { stream, routingDecision } = await orchestrateStandaloneChat(
      {
        organizationId,
        messages: messages as never,
        context,
        maxSteps: 5,
        log,
        requestedModel: model,
        enableThinking,
        thinkingLevel,
        timezone,
        abortSignal: combinedAbortSignal,
      },
      {
        preValidatedIntegrations: validatedIntegrations,
        resolveContext: getGitHubToolRepositoryContextByIntegrationId,
        resolveLinearContext: getLinearToolContextByIntegrationId,
        onFirstChunk() {
          if (firstChunkAt === null) {
            firstChunkAt = Date.now();
          }
        },
        async onUsage(usage, modelId) {
          usageSnapshot.inputTokens = usage.inputTokens ?? 0;
          usageSnapshot.outputTokens = usage.outputTokens ?? 0;
          usageSnapshot.totalTokens = usage.totalTokens ?? 0;

          if (!autumnClient) {
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
            await autumnClient.track({
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
        log,
      }
    );

    return stream.toUIMessageStreamResponse({
      originalMessages: messages as never,
      generateMessageId: nanoid,
      sendReasoning: enableThinking !== false,
      headers: { "X-Chat-Id": chatId },
      messageMetadata: ({ part }) => {
        const effectiveThinkingLevel =
          enableThinking === false
            ? "off"
            : (routingDecision.thinkingLevel ?? thinkingLevel);

        if (part.type === "start") {
          return {
            chatId,
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
            firstChunkAt,
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
            responseMessages
          );
          if (!saved) {
            console.warn(
              "[Standalone Chat] Skipped saving response: chat was deleted",
              { requestId, organizationId, chatId }
            );
          }
        } finally {
          await cleanup();
        }
      },
      onError: (error) => {
        cleanup().catch(() => undefined);
        console.error("[Standalone Chat] Direct stream error:", {
          requestId,
          error,
        });
        if (
          combinedAbortSignal.aborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return "Generation stopped.";
        }
        if (error instanceof Error) {
          return error.message;
        }
        return "An error occurred while processing your request.";
      },
    });
  } catch (error) {
    await cleanup();
    throw error;
  }
}
