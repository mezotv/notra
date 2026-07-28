// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const standaloneChatContextSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("github-repo"),
    integrationId: z.string(),
    owner: z.string(),
    repo: z.string(),
  }),
  z.object({
    type: z.literal("linear-team"),
    integrationId: z.string(),
    teamName: z.string().optional(),
  }),
  z.object({
    type: z.literal("mcp-server"),
    integrationId: z.string(),
    name: z.string().trim().min(1).max(200),
  }),
]);

export type StandaloneChatContextItem = z.infer<
  typeof standaloneChatContextSchema
>;

export const standaloneChatRequestSchema = z.object({
  chatId: z.string().optional(),
  messages: z.array(z.any()),
  context: z.array(standaloneChatContextSchema).optional(),
});

export type StandaloneChatRequest = z.infer<typeof standaloneChatRequestSchema>;
