import type { z } from "@hono/zod-openapi";
import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { shouldApplyMarkup } from "@notra/ai/billing/token-pricing";
import {
  claimChatSessionForExternalChannel,
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
import type { UIMessage } from "ai";
import type { CheckResponse } from "autumn-js";
import type { Context } from "hono";
import { nanoid } from "nanoid";
import type { sendChatMessageRequestSchema } from "../../schemas/chats";
import { deriveContextFromValidatedIntegrations } from "./context";
import { createDirectStandaloneChatResponse } from "./direct-stream";
import { buildApiChatTelemetryMetadata } from "./tcc";

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
    externalChannelId,
  } = body;

  let resolvedChatId = existingChatId;
  let isNewChat = resolvedChatId === null;
  let externalChannelClaimed = false;

  if (resolvedChatId) {
    const existingChat = await getChatSession(organizationId, resolvedChatId);
    if (!existingChat) {
      return c.json({ error: "Chat not found" }, 404);
    }
  } else if (
    externalChannelId &&
    externalChannelId.source !== "dashboard" &&
    externalChannelId.id
  ) {
    const claim = await claimChatSessionForExternalChannel(
      organizationId,
      externalChannelId.source,
      externalChannelId.id,
      generateChatId()
    );
    resolvedChatId = claim.chatId;
    isNewChat = claim.created;
    externalChannelClaimed = true;
  }

  const chatId = resolvedChatId ?? generateChatId();
  const auth = c.get("auth") as { keyId?: string } | undefined;

  const existingMessages = isNewChat
    ? []
    : await loadChatHistory(organizationId, chatId);

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

  const externalChannelIdForInsert =
    isNewChat && !externalChannelClaimed ? externalChannelId : undefined;

  const [historySaved] = await Promise.all([
    replaceChatHistory(
      organizationId,
      chatId,
      messages,
      externalChannelIdForInsert
    ),
    setActiveChatStream(organizationId, chatId, userMessage.id),
    clearLastResponseStopped(organizationId, chatId),
  ]);

  if (!historySaved) {
    return c.json({ error: "Chat not found" }, 404);
  }

  if (existingMessages.length === 0) {
    await generateAndSetChatTitle(organizationId, chatId, userMessage);
  }

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
    externalChannelId,
    telemetryMetadata: buildApiChatTelemetryMetadata({
      apiKeyId: auth?.keyId,
      chatId,
      externalChannelId: externalChannelId?.id,
      externalChannelSource: externalChannelId?.source,
      existingChatId,
      organizationId,
    }),
  });
}
