import { chatErrorPayloadSchema } from "@notra/ai/schemas/chat";
import {
  CHAT_FALLBACK_ERROR_MESSAGE,
  CHAT_USAGE_LIMIT_MESSAGE,
} from "@/utils/chat-error-constants";
import type { HandleStandaloneChatErrorOptions } from "@/utils/chat-error-types";

function getStandaloneChatErrorMessage(err: Error) {
  const errorMessage = err.message || String(err);

  const parsed = (() => {
    try {
      return chatErrorPayloadSchema.safeParse(JSON.parse(errorMessage));
    } catch {
      return null;
    }
  })();

  if (parsed?.success && parsed.data.code === "USAGE_LIMIT_REACHED") {
    return {
      message: CHAT_USAGE_LIMIT_MESSAGE,
      shouldLog: false,
      isUsageLimit: true,
    };
  }

  if (parsed?.success && parsed.data.error) {
    return {
      message: parsed.data.error,
      shouldLog: false,
      isUsageLimit: false,
    };
  }

  if (
    errorMessage.includes("USAGE_LIMIT_REACHED") ||
    errorMessage.includes("Usage limit reached")
  ) {
    return {
      message: CHAT_USAGE_LIMIT_MESSAGE,
      shouldLog: false,
      isUsageLimit: true,
    };
  }

  return {
    message: errorMessage.trim() ? errorMessage : CHAT_FALLBACK_ERROR_MESSAGE,
    shouldLog: true,
    isUsageLimit: false,
  };
}

export function handleStandaloneChatError(
  err: Error,
  { setChatError, setPendingMessageId }: HandleStandaloneChatErrorOptions
) {
  const { message, shouldLog, isUsageLimit } =
    getStandaloneChatErrorMessage(err);

  if (shouldLog) {
    console.error("Standalone chat error:", err);
  }

  setChatError(message);
  setPendingMessageId?.(null);
  return { isUsageLimit };
}
