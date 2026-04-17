import type {
  ContextItem as OrchestrationContextItem,
  TextSelection as OrchestrationTextSelection,
} from "@notra/ai/types/orchestration";
import type { UIMessage } from "ai";
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
