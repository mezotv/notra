import type { z } from "@hono/zod-openapi";
import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { shouldApplyMarkup } from "@notra/ai/billing/token-pricing";
import {
  clearActiveChatStream,
  clearLastResponseStopped,
  generateAndSetChatTitle,
  generateChatId,
  getChatSession,
  loadChatHistory,
  replaceChatHistory,
  setActiveChatStream,
} from "@notra/ai/chat/history";
import { getStandaloneChatIntegrations } from "@notra/ai/chat/integrations-cache";
import type { useLogger } from "@notra/ai/evlog";
import { getWorkflowClient } from "@notra/ai/qstash/client";
import { getBaseUrl } from "@notra/ai/qstash/triggers";
import type { UIMessage } from "ai";
import type { CheckResponse } from "autumn-js";
import type { Context } from "hono";
import { nanoid } from "nanoid";
import type { sendChatMessageRequestSchema } from "../../schemas/chats";
import { deriveContextFromValidatedIntegrations } from "./context";
import { createDirectStandaloneChatResponse } from "./direct-stream";
import { canUseUpstashWorkflowStreaming } from "./streaming";

type SendChatMessageInput = z.infer<typeof sendChatMessageRequestSchema>;

interface RunChatMessageArgs {
  c: Context;
  organizationId: string;
  existingChatId: string | null;
  body: SendChatMessageInput;
  log: ReturnType<typeof useLogger>;
  requestId: string;
}

export async function runChatMessage({
  c,
  organizationId,
  existingChatId,
  body,
  log,
  requestId,
}: RunChatMessageArgs): Promise<Response> {
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
      return c.json(
        { error: "Failed to check usage limits", code: "BILLING_ERROR" },
        500
      );
    }

    if (!checkData?.allowed) {
      return c.json(
        {
          error: "Usage limit reached",
          code: "USAGE_LIMIT_REACHED",
          balance: checkData?.balance ?? 0,
        },
        403
      );
    }

    useMarkup = shouldApplyMarkup(checkData?.balance ?? null);
  }

  const {
    message,
    model,
    enableThinking,
    thinkingLevel,
    timezone,
    context: inputContext,
  } = body;

  const chatId = existingChatId ?? generateChatId();

  if (existingChatId) {
    const existingChat = await getChatSession(organizationId, chatId);
    if (!existingChat) {
      return c.json({ error: "Chat not found" }, 404);
    }
  }

  const existingMessages = existingChatId
    ? await loadChatHistory(organizationId, chatId)
    : [];

  const userMessage: UIMessage = {
    id: nanoid(),
    role: "user",
    parts: [{ type: "text", text: message }],
  };

  const messages = [...existingMessages, userMessage];

  const validatedIntegrations =
    await getStandaloneChatIntegrations(organizationId);
  const context =
    inputContext ??
    deriveContextFromValidatedIntegrations(validatedIntegrations);

  const [historySaved] = await Promise.all([
    replaceChatHistory(organizationId, chatId, messages),
    setActiveChatStream(organizationId, chatId, userMessage.id),
    clearLastResponseStopped(organizationId, chatId),
  ]);

  if (!historySaved) {
    return c.json({ error: "Chat not found" }, 404);
  }

  if (existingMessages.length === 0) {
    await generateAndSetChatTitle(organizationId, chatId, userMessage);
  }

  try {
    if (!canUseUpstashWorkflowStreaming()) {
      return await createDirectStandaloneChatResponse({
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
        abortSignal: c.req.raw.signal,
      });
    }

    await getWorkflowClient().trigger({
      url: `${getBaseUrl()}/internal/workflows/chat`,
      body: {
        requestId,
        organizationId,
        chatId,
        userId: organizationId,
        userEmail: null,
        context,
        useMarkup,
        model,
        enableThinking,
        thinkingLevel,
        timezone,
      },
    });

    c.header("X-Chat-Id", chatId);
    return c.json({ ok: true, chatId, streamId: userMessage.id }, 202);
  } catch (error) {
    await clearActiveChatStream(organizationId, chatId).catch(() => undefined);
    throw error;
  }
}
