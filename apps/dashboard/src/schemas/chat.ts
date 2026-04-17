import { standaloneChatContextSchema } from "@notra/ai/schemas/standalone-chat";
import type { UIMessage } from "ai";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { CHAT_TITLE_MAX_LENGTH } from "@/constants/chat";

export const chatModelSchema = z.enum([
  "anthropic/claude-opus-4-7",
  "anthropic/claude-sonnet-4-6",
  "anthropic/claude-haiku-4-5",
  "openai/gpt-5.4",
]);

export const thinkingLevelSchema = z.enum(["off", "low", "medium", "high"]);

export const chatMessageMetadataSchema = z.object({
  model: chatModelSchema.optional(),
  thinkingLevel: thinkingLevelSchema.optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  ttftMs: z.number().nonnegative().optional(),
  generationDurationMs: z.number().nonnegative().optional(),
  tokensPerSecond: z.number().nonnegative().optional(),
  createdAt: z.number().int().nonnegative().optional(),
});

const uiMessageSchema = z.custom<UIMessage>((value) => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { id?: unknown; role?: unknown; parts?: unknown };
  return (
    typeof candidate.id === "string" &&
    typeof candidate.role === "string" &&
    Array.isArray(candidate.parts)
  );
}, "Invalid chat message");

export const standaloneChatRequestSchema = z.object({
  chatId: z.string().min(1).optional(),
  messages: z.array(uiMessageSchema).min(1),
  context: z.array(standaloneChatContextSchema).optional(),
  model: chatModelSchema.optional(),
  enableThinking: z.boolean().optional(),
  thinkingLevel: thinkingLevelSchema.optional(),
});

export const updateChatSessionSchema = z
  .object({
    title: z.string().trim().min(1).max(CHAT_TITLE_MAX_LENGTH).optional(),
    pinned: z.boolean().optional(),
  })
  .refine(
    (value) =>
      Number(value.title !== undefined) + Number(value.pinned !== undefined) ===
      1,
    {
      message: "Provide exactly one update operation",
    }
  );

export const chatWorkflowPayloadSchema = z.object({
  requestId: z.string().min(1),
  organizationId: z.string().min(1),
  chatId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email().nullable().optional(),
  context: z.array(standaloneChatContextSchema),
  useMarkup: z.boolean(),
  model: chatModelSchema.optional(),
  enableThinking: z.boolean().optional(),
  thinkingLevel: thinkingLevelSchema.optional(),
});

export const chatTransportRequestBodySchema = z.object({
  chatId: z.string().min(1),
  messages: z.array(
    z.object({
      id: z.string().min(1).optional(),
    })
  ),
});

const chatTransportRequestJsonSchema = z
  .string()
  .transform((value, context) => {
    try {
      return JSON.parse(value);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid transport request JSON",
      });
      return z.NEVER;
    }
  });

export const chatTransportRequestInputSchema = z.union([
  chatTransportRequestBodySchema,
  chatTransportRequestJsonSchema.pipe(chatTransportRequestBodySchema),
]);

export const chatErrorPayloadSchema = z.object({
  error: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
});

export const storedChatPreferencesSchema = z.object({
  model: chatModelSchema,
  thinkingLevel: thinkingLevelSchema,
});

export const chatSessionSummarySchema = z.object({
  chatId: z.string().min(1),
  title: z.string().min(1),
  updatedAt: z.string().min(1),
  createdAt: z.string().min(1),
  pinnedAt: z.string().min(1).nullable(),
});

export const chatSessionResponseSchema = z.object({
  session: chatSessionSummarySchema.optional(),
});

export const chatSessionsListResponseSchema = z.object({
  sessions: z.array(chatSessionSummarySchema).optional(),
});
