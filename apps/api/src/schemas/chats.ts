import { z } from "@hono/zod-openapi";
import { chatModelSchema, thinkingLevelSchema } from "@notra/ai/schemas/chat";
import { standaloneChatContextSchema } from "@notra/ai/schemas/standalone-chat";

export const chatSessionSummarySchema = z
  .object({
    chatId: z.string(),
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    pinnedAt: z.string().nullable(),
  })
  .openapi("ChatSessionSummary");

const uiMessageSchema = z.unknown().openapi("ChatMessage");

export const getChatParamsSchema = z.object({
  chatId: z
    .string()
    .min(1)
    .openapi({
      param: { name: "chatId", in: "path" },
      example: "chat_abc123",
    }),
});

export const sendChatMessageRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(50_000),
    model: chatModelSchema.optional(),
    enableThinking: z.boolean().optional(),
    thinkingLevel: thinkingLevelSchema.optional(),
    timezone: z.string().min(1).max(100).optional(),
    context: z.array(standaloneChatContextSchema).optional(),
  })
  .openapi("SendChatMessageRequest");

export const sendChatMessageQueuedResponseSchema = z
  .object({
    ok: z.literal(true),
    chatId: z.string(),
    streamId: z.string(),
  })
  .openapi("SendChatMessageQueuedResponse");

export const sendChatParamsSchema = z.object({
  chatId: z
    .string()
    .min(1)
    .openapi({
      param: { name: "chatId", in: "path" },
      example: "chat_abc123",
    }),
});

export const getChatsResponseSchema = z
  .object({
    chats: z.array(chatSessionSummarySchema),
  })
  .openapi("GetChatsResponse");

export const getChatResponseSchema = z
  .object({
    chat: chatSessionSummarySchema,
    messages: z.array(uiMessageSchema),
  })
  .openapi("GetChatResponse");
