import type { TccMetadata } from "@notra/ai/types/tcc";

export function buildApiChatTelemetryMetadata({
  apiKeyId,
  chatId,
  externalChannelId,
  externalChannelSource,
  existingChatId,
  organizationId,
}: {
  apiKeyId?: string;
  chatId: string;
  externalChannelId?: string;
  externalChannelSource?: string;
  existingChatId: string | null;
  organizationId: string;
}): TccMetadata {
  return {
    apiKeyId,
    chatId,
    externalChannelId,
    externalChannelSource,
    feature: "standalone_chat",
    organizationId,
    routeName: existingChatId === null ? "/v1/chats" : "/v1/chats/{chatId}",
    "tcc.conversational": "true",
    "tcc.sessionId": chatId,
  };
}
