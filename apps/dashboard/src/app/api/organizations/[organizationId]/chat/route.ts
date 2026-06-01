import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import {
  calculateTokenCostCents,
  shouldApplyMarkup,
} from "@notra/ai/billing/token-pricing";
import { startChatAbortPolling } from "@notra/ai/chat/abort-polling";
import {
  clearActiveChatStream,
  clearChatAbortFlag,
  clearLastResponseStopped,
  generateAndSetChatTitle,
  generateChatId,
  isChatDeleted,
  loadChatHistory,
  replaceChatHistory,
  setActiveChatStream,
} from "@notra/ai/chat/history";
import { getStandaloneChatIntegrations } from "@notra/ai/chat/integrations-cache";
import { useLogger, withEvlog } from "@notra/ai/evlog";
import { getGitHubToolRepositoryContextByIntegrationId } from "@notra/ai/integrations/github";
import { getLinearToolContextByIntegrationId } from "@notra/ai/integrations/linear";
import { orchestrateStandaloneChat } from "@notra/ai/orchestration/orchestrate-standalone";
import { getWorkflowClient } from "@notra/ai/qstash/client";
import { getBaseUrl } from "@notra/ai/qstash/triggers";
import { realtime } from "@notra/ai/realtime";
import { standaloneChatRequestSchema } from "@notra/ai/schemas/chat";
import type { StandaloneChatContextItem } from "@notra/ai/schemas/standalone-chat";
import type { ChatUsageSnapshot } from "@notra/ai/types/chat";
import type { ValidatedIntegration } from "@notra/ai/types/orchestration";
import type { TccMetadata } from "@notra/ai/types/tcc";
import { buildChatFinishMetadata } from "@notra/ai/utils/chat";
import type { UIMessage } from "ai";
import type { CheckResponse } from "autumn-js";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { buildStandaloneChatTelemetryMetadata } from "@/lib/tcc";
import type { RouteContext } from "@/types/api/routes";

export const maxDuration = 60;

export const POST = withEvlog(async function POST(
  request: NextRequest,
  { params }: RouteContext<{ organizationId: string }>
) {
  const requestId = nanoid(10);
  const log = useLogger();
  let cleanupOrganizationId: string | null = null;
  let cleanupChatId: string | null = null;

  try {
    const { organizationId } = await params;

    log.set({
      feature: "standalone_chat",
      organizationId,
      requestId,
    });

    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    let useMarkup = false;
    if (autumn) {
      let checkData: CheckResponse | null = null;
      try {
        checkData = await autumn.check({
          customerId: organizationId,
          featureId: FEATURES.AI_CREDITS,
        });
      } catch (checkError) {
        console.error("[Autumn] Check error:", {
          requestId,
          customerId: organizationId,
          error: checkError,
        });
        return NextResponse.json(
          { error: "Failed to check usage limits", code: "BILLING_ERROR" },
          { status: 500 }
        );
      }

      if (!checkData?.allowed) {
        return NextResponse.json(
          {
            error: "Usage limit reached",
            code: "USAGE_LIMIT_REACHED",
            balance: checkData?.balance ?? 0,
          },
          { status: 403 }
        );
      }

      useMarkup = shouldApplyMarkup(checkData?.balance ?? null);
    }

    const body = await request.json();
    const parseResult = standaloneChatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { messages } = parseResult.data;
    const chatId = parseResult.data.chatId ?? generateChatId();
    cleanupOrganizationId = organizationId;
    cleanupChatId = chatId;
    const validatedIntegrations =
      await getStandaloneChatIntegrations(organizationId);
    const context =
      parseResult.data.context ??
      deriveContextFromValidatedIntegrations(validatedIntegrations);

    if (!messages.length) {
      return NextResponse.json(
        { error: "At least one message is required" },
        { status: 400 }
      );
    }

    const latestMessage = messages.at(-1);
    if (!latestMessage?.id) {
      return NextResponse.json(
        { error: "Latest message must include an id" },
        { status: 400 }
      );
    }

    if (
      parseResult.data.chatId &&
      (await isChatDeleted(organizationId, chatId))
    ) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const [historySaved] = await Promise.all([
      replaceChatHistory(organizationId, chatId, messages),
      setActiveChatStream(organizationId, chatId, latestMessage.id),
      clearLastResponseStopped(organizationId, chatId),
    ]);

    if (!historySaved) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (messages.length === 1 && latestMessage.role === "user") {
      await generateAndSetChatTitle(organizationId, chatId, latestMessage);
    }

    const canUseWorkflowStreaming = canUseUpstashWorkflowStreaming();
    const telemetryMetadata = buildStandaloneChatTelemetryMetadata({
      chatId,
      organizationId,
      routeName: "/api/organizations/[organizationId]/chat",
      userId: auth.context.user.id,
    });

    if (!canUseWorkflowStreaming) {
      return createDirectStandaloneChatResponse({
        organizationId,
        userId: auth.context.user.id,
        chatId,
        messages,
        context,
        validatedIntegrations,
        useMarkup,
        requestId,
        log,
        model: parseResult.data.model,
        enableThinking: parseResult.data.enableThinking,
        thinkingLevel: parseResult.data.thinkingLevel,
        timezone: parseResult.data.timezone,
        abortSignal: request.signal,
        telemetryMetadata,
      });
    }

    await getWorkflowClient().trigger({
      url: `${getBaseUrl()}/api/workflows/chat`,
      body: {
        requestId,
        organizationId,
        chatId,
        userId: auth.context.user.id,
        userEmail: auth.context.user.email,
        context,
        useMarkup,
        model: parseResult.data.model,
        enableThinking: parseResult.data.enableThinking,
        thinkingLevel: parseResult.data.thinkingLevel,
        timezone: parseResult.data.timezone,
      },
    });

    return NextResponse.json(
      { ok: true, chatId, streamId: latestMessage.id },
      { status: 202, headers: { "X-Chat-Id": chatId } }
    );
  } catch (e) {
    if (cleanupOrganizationId && cleanupChatId) {
      await clearActiveChatStream(cleanupOrganizationId, cleanupChatId).catch(
        () => undefined
      );
    }
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("[Standalone Chat] Error:", {
      requestId,
      error: errorMessage,
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Failed to process chat request",
      },
      { status: 500 }
    );
  }
});

function canUseUpstashWorkflowStreaming() {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.FORCE_UPSTASH_CHAT_STREAMING !== "true"
  ) {
    return false;
  }

  if (!(realtime && process.env.QSTASH_TOKEN)) {
    return false;
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return false;
  }

  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function deriveContextFromValidatedIntegrations(
  validatedIntegrations: ValidatedIntegration[]
): StandaloneChatContextItem[] {
  const items: StandaloneChatContextItem[] = [];
  for (const integration of validatedIntegrations) {
    if (integration.type === "github") {
      for (const repository of integration.repositories) {
        if (
          repository.enabled &&
          typeof repository.owner === "string" &&
          repository.owner.length > 0 &&
          typeof repository.repo === "string" &&
          repository.repo.length > 0
        ) {
          items.push({
            type: "github-repo",
            integrationId: integration.id,
            owner: repository.owner,
            repo: repository.repo,
          });
        }
      }
    } else if (integration.type === "linear") {
      items.push({
        type: "linear-team",
        integrationId: integration.id,
        teamName: integration.linearTeamName ?? undefined,
      });
    }
  }
  return items;
}

async function createDirectStandaloneChatResponse({
  organizationId,
  userId,
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
  telemetryMetadata,
}: {
  organizationId: string;
  userId: string;
  chatId: string;
  messages: UIMessage[];
  context: StandaloneChatContextItem[];
  validatedIntegrations: ValidatedIntegration[];
  useMarkup: boolean;
  requestId: string;
  log: ReturnType<typeof useLogger>;
  model?: string;
  enableThinking?: boolean;
  thinkingLevel?: "off" | "low" | "medium" | "high";
  timezone?: string;
  abortSignal?: AbortSignal;
  telemetryMetadata: TccMetadata;
}) {
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

  const responseReady = createDeferred<Response>();
  const streamDone = createDeferred<void>();

  const runStream = async (streamLog: ReturnType<typeof useLogger>) => {
    const { stream, routingDecision } = await orchestrateStandaloneChat(
      {
        organizationId,
        chatId,
        userId,
        messages: messages as never,
        context,
        maxSteps: 5,
        log: streamLog,
        requestedModel: model,
        enableThinking,
        thinkingLevel,
        timezone,
        abortSignal: combinedAbortSignal,
        telemetryMetadata,
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
          usageSnapshot.cacheReadTokens =
            usage.inputTokenDetails?.cacheReadTokens ?? 0;
          usageSnapshot.cacheWriteTokens =
            usage.inputTokenDetails?.cacheWriteTokens ?? 0;

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
        log: streamLog,
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
          streamDone.resolve();
        }
      },
      onError: (error) => {
        cleanup().catch(() => undefined);
        streamDone.resolve();
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
  };

  const fork = (
    log as typeof log & {
      fork?: (label: string, callback: () => Promise<void>) => void;
    }
  ).fork;

  if (fork) {
    fork("standalone_chat_stream", async () => {
      try {
        // biome-ignore lint/correctness/useHookAtTopLevel: useLogger is an async-context accessor, not a React hook
        const response = await runStream(useLogger());
        responseReady.resolve(response);
        await streamDone.promise;
      } catch (error) {
        responseReady.reject(error);
        streamDone.resolve();
        await cleanup();
        throw error;
      }
    });
    return responseReady.promise;
  }

  try {
    return await runStream(log);
  } catch (error) {
    await cleanup();
    throw error;
  }
}

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
