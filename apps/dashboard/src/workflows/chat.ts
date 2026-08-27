import { chatWorkflowPayloadSchema } from "@notra/ai/schemas/chat";
import type { ChatWorkflowPayload } from "@notra/ai/types/chat";
import { flattenError } from "zod";

import type { StandaloneChatWorkflowResult } from "@/types/workflows/chat";

import {
  claimChatWorkflowRequestStep,
  recheckChatBillingStep,
  rejectChatGenerationStep,
  resolveChatStreamStep,
  streamChatResponseStep,
} from "./steps/chat-steps";

export async function standaloneChatWorkflow(
  payload: ChatWorkflowPayload
): Promise<StandaloneChatWorkflowResult> {
  "use workflow";

  const parseResult = chatWorkflowPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error(
      "[Chat Workflow] Invalid payload:",
      flattenError(parseResult.error)
    );
    return { status: "invalid_payload" };
  }
  const { requestId, organizationId, chatId } = parseResult.data;

  const requestClaimed = await claimChatWorkflowRequestStep(requestId);
  if (!requestClaimed) {
    console.error("[Chat Workflow] Duplicate or unclaimable request", {
      requestId,
      organizationId,
      chatId,
    });
    return { status: "duplicate_request" };
  }

  const stream = await resolveChatStreamStep({ organizationId, chatId });
  if (stream.status !== "ready") {
    return { status: stream.status };
  }

  const creditCheck = await recheckChatBillingStep({
    requestId,
    organizationId,
    chatId,
  });
  if (!creditCheck.allowed) {
    await rejectChatGenerationStep({
      requestId,
      organizationId,
      chatId,
      streamId: stream.streamId,
      unavailable: creditCheck.unavailable,
    });
    return { status: "usage_limit_reached" };
  }

  return await streamChatResponseStep({
    ...parseResult.data,
    streamId: stream.streamId,
    chargeAiCredits: creditCheck.chargeAiCredits,
  });
}
