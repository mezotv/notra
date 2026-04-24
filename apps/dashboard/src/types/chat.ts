import type {
  ContextItem as OrchestrationContextItem,
  TextSelection as OrchestrationTextSelection,
} from "@notra/ai/types/orchestration";
import type { LanguageModelUsage, UIMessage } from "ai";
import type { z } from "zod";
import type {
  chatMessageMetadataSchema,
  chatModelSchema,
  chatSessionSummarySchema,
  chatTransportRequestInputSchema,
  chatWorkflowPayloadSchema,
  storedChatPreferencesSchema,
  thinkingLevelSchema,
  updateChatSessionSchema,
} from "@/schemas/chat";

export type TextSelection = OrchestrationTextSelection;
export type ContextItem = OrchestrationContextItem;
export type StandaloneChatContextItem = OrchestrationContextItem;
export type ChatModel = z.infer<typeof chatModelSchema>;
export type ThinkingLevel = z.infer<typeof thinkingLevelSchema>;
export type ChatMessageMetadata = z.infer<typeof chatMessageMetadataSchema>;
export type ChatUIMessage = UIMessage<ChatMessageMetadata>;
export type StoredChatPreferences = z.infer<typeof storedChatPreferencesSchema>;
export type ChatSessionSummary = z.infer<typeof chatSessionSummarySchema>;
export type UpdateChatSessionInput = z.infer<typeof updateChatSessionSchema>;
export type ChatWorkflowPayload = z.infer<typeof chatWorkflowPayloadSchema>;
export type ChatTransportRequestInput = z.infer<
  typeof chatTransportRequestInputSchema
>;

export interface ChatUsageSnapshot {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface ChatImageAttachmentProps {
  url: string;
  filename: string | undefined;
  mediaType: string;
  onClick: () => void;
}

export interface ChatInputHandle {
  setText: (text: string) => void;
  focus: () => void;
}

export interface ChatAttachment {
  url: string;
  key: string;
  filename: string;
  mediaType: string;
  size: number;
}

export type ChatMessagePart =
  | { type: "text"; text: string }
  | {
      type: "file";
      url: string;
      mediaType: string;
      filename?: string;
    };

export interface BuildChatFinishMetadataInput {
  streamStartedAt: number;
  firstChunkAt: number | null;
  finishedAt: number;
  partUsage: LanguageModelUsage | undefined;
  usageSnapshot: ChatUsageSnapshot;
  model?: ChatModel | string;
  requestedModel?: ChatModel | string;
  thinkingLevel?: ThinkingLevel;
  requestedThinkingLevel?: ThinkingLevel;
}
