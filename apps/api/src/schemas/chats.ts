import { z } from "@hono/zod-openapi";
import {
  chatModelSchema,
  externalChannelLookupSourceSchema,
  externalChannelSourceSchema,
  thinkingLevelSchema,
} from "@notra/ai/schemas/chat";
import { standaloneChatContextSchema } from "@notra/ai/schemas/standalone-chat";

export const externalChannelIdSchema = z
  .object({
    source: externalChannelSourceSchema,
    id: z.string().max(200).optional(),
  })
  .refine(
    (value) =>
      value.source === "dashboard" ||
      (typeof value.id === "string" && value.id.length > 0),
    { message: "id is required for discord and slack sources" }
  )
  .openapi("ExternalChannelId");

export const chatSessionSummarySchema = z
  .object({
    chatId: z.string(),
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    pinnedAt: z.string().nullable(),
    externalChannelId: externalChannelIdSchema.nullable().optional(),
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
    externalChannelId: externalChannelIdSchema.optional(),
  })
  .openapi("SendChatMessageRequest");

export const getChatByExternalQuerySchema = z.object({
  source: externalChannelLookupSourceSchema.openapi({
    param: { name: "source", in: "query" },
    example: "discord",
  }),
  id: z
    .string()
    .min(1)
    .max(200)
    .openapi({
      param: { name: "id", in: "query" },
      example: "channel_123",
    }),
});

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
