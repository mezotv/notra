import type { TccMetadata } from "@notra/ai/types/tcc";

export function buildStandaloneChatTelemetryMetadata({
  chatId,
  organizationId,
  routeName,
  userId,
}: {
  chatId: string;
  organizationId: string;
  routeName: string;
  userId: string;
}): TccMetadata {
  return {
    chatId,
    feature: "standalone_chat",
    organizationId,
    routeName,
    "tcc.conversational": "true",
    "tcc.sessionId": chatId,
    userId,
  };
}
