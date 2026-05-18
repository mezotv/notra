import { db } from "@notra/db/drizzle";
import { chatSessions } from "@notra/db/schema";
import { generateText, type UIMessage } from "ai";
import { and, eq, isNull, sql } from "drizzle-orm";
import {
  CHAT_ABORT_FLAG_TTL_SECONDS,
  CHAT_LAST_STOPPED_TTL_SECONDS,
} from "../constants/chat";
import { gateway } from "../gateway";
import type {
  ChatSessionSummary,
  ExternalChannelId,
  ExternalChannelLookupSource,
} from "../types/chat";
import { normalizeChatTitle, sortChatSessions } from "../utils/chat";
import { buildExperimentalTelemetry } from "../utils/tcc";
import { getChatRedis } from "./config";

function activeStreamKey(organizationId: string, chatId: string) {
  return `chat:stream:${organizationId}:${chatId}`;
}

function abortFlagKey(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  return `chat:abort:${organizationId}:${chatId}:${streamId}`;
}

function lastStoppedKey(organizationId: string, chatId: string) {
  return `chat:lastStopped:${organizationId}:${chatId}`;
}

export function getChatStreamChannelName(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  return `chat:${organizationId}:${chatId}:${streamId}`;
}

export function generateChatId() {
  return crypto.randomUUID();
}

function toExternalChannelId(
  source: string | null,
  id: string | null
): ExternalChannelId | null {
  if (!source) {
    return null;
  }
  if (source === "dashboard") {
    return { source };
  }
  if ((source === "discord" || source === "slack") && id) {
    return { source, id };
  }
  return null;
}

function toSessionSummary(
  row: typeof chatSessions.$inferSelect
): ChatSessionSummary {
  return {
    chatId: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    pinnedAt: row.pinnedAt?.toISOString() ?? null,
    externalChannelId: toExternalChannelId(
      row.externalChannelSource,
      row.externalChannelId
    ),
  };
}

export async function isChatDeleted(
  organizationId: string,
  chatId: string
): Promise<boolean> {
  const row = await db
    .select({ deletedAt: chatSessions.deletedAt })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.id, chatId),
        eq(chatSessions.organizationId, organizationId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) {
    return false;
  }

  return row.deletedAt !== null;
}

async function upsertChatSession(
  organizationId: string,
  chatId: string,
  messages: UIMessage[],
  mode: "append" | "replace",
  externalChannelId?: ExternalChannelId | null
) {
  if (mode === "append") {
    const insertedOrUpdated = await db
      .insert(chatSessions)
      .values({
        id: chatId,
        organizationId,
        title: normalizeChatTitle(getChatTitle(messages) ?? "New chat"),
        messages: sql`${JSON.stringify(messages)}::jsonb`,
        externalChannelSource: externalChannelId?.source ?? null,
        externalChannelId: externalChannelId?.id ?? null,
      })
      .onConflictDoUpdate({
        target: chatSessions.id,
        set: {
          messages: sql`${chatSessions.messages} || ${JSON.stringify(messages)}::jsonb`,
        },
        setWhere: and(
          eq(chatSessions.organizationId, organizationId),
          isNull(chatSessions.deletedAt)
        ),
      })
      .returning({ id: chatSessions.id });

    return insertedOrUpdated.length > 0;
  }

  const existingRow = await db
    .select({
      messages: chatSessions.messages,
      title: chatSessions.title,
      deletedAt: chatSessions.deletedAt,
    })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.id, chatId),
        eq(chatSessions.organizationId, organizationId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (existingRow?.deletedAt !== undefined && existingRow.deletedAt !== null) {
    return false;
  }

  const title =
    existingRow?.title ??
    normalizeChatTitle(getChatTitle(messages) ?? "New chat");

  const finalMessages =
    mode === "replace" || !existingRow
      ? messages
      : [...(existingRow.messages as UIMessage[]), ...messages];

  if (existingRow) {
    const updated = await db
      .update(chatSessions)
      .set({
        messages: finalMessages as unknown as Record<string, unknown>,
        title,
      })
      .where(
        and(
          eq(chatSessions.id, chatId),
          eq(chatSessions.organizationId, organizationId),
          isNull(chatSessions.deletedAt)
        )
      )
      .returning({ id: chatSessions.id });

    if (updated.length === 0) {
      return false;
    }
  } else {
    await db.insert(chatSessions).values({
      id: chatId,
      organizationId,
      title,
      messages: messages as unknown as Record<string, unknown>,
      externalChannelSource: externalChannelId?.source ?? null,
      externalChannelId: externalChannelId?.id ?? null,
    });
  }

  return true;
}

export async function saveChatMessage(
  organizationId: string,
  chatId: string,
  message: UIMessage
): Promise<boolean> {
  return upsertChatSession(organizationId, chatId, [message], "append");
}

export async function saveChatMessages(
  organizationId: string,
  chatId: string,
  messages: UIMessage[]
): Promise<boolean> {
  return upsertChatSession(organizationId, chatId, messages, "append");
}

export async function replaceChatHistory(
  organizationId: string,
  chatId: string,
  messages: UIMessage[],
  externalChannelId?: ExternalChannelId | null
): Promise<boolean> {
  return upsertChatSession(
    organizationId,
    chatId,
    messages,
    "replace",
    externalChannelId
  );
}

export async function loadChatHistory(
  organizationId: string,
  chatId: string
): Promise<UIMessage[]> {
  const row = await db
    .select({
      messages: chatSessions.messages,
      deletedAt: chatSessions.deletedAt,
    })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.id, chatId),
        eq(chatSessions.organizationId, organizationId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!row || row.deletedAt !== null) {
    return [];
  }

  return row.messages as UIMessage[];
}

export async function createChatSession(
  organizationId: string,
  options?: {
    id?: string;
    title?: string;
    externalChannelId?: ExternalChannelId | null;
  }
): Promise<ChatSessionSummary> {
  const id = options?.id ?? generateChatId();
  const title = normalizeChatTitle(options?.title ?? "New chat") || "New chat";

  const [row] = await db
    .insert(chatSessions)
    .values({
      id,
      organizationId,
      title,
      messages: [] as unknown as Record<string, unknown>,
      externalChannelSource: options?.externalChannelId?.source ?? null,
      externalChannelId: options?.externalChannelId?.id ?? null,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create chat session");
  }

  return toSessionSummary(row);
}

export async function getChatSession(
  organizationId: string,
  chatId: string
): Promise<ChatSessionSummary | null> {
  const row = await db
    .select({
      id: chatSessions.id,
      title: chatSessions.title,
      createdAt: chatSessions.createdAt,
      updatedAt: chatSessions.updatedAt,
      pinnedAt: chatSessions.pinnedAt,
      externalChannelSource: chatSessions.externalChannelSource,
      externalChannelId: chatSessions.externalChannelId,
    })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.id, chatId),
        eq(chatSessions.organizationId, organizationId),
        isNull(chatSessions.deletedAt)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) {
    return null;
  }

  return {
    chatId: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    pinnedAt: row.pinnedAt?.toISOString() ?? null,
    externalChannelId: toExternalChannelId(
      row.externalChannelSource,
      row.externalChannelId
    ),
  };
}

export async function claimChatSessionForExternalChannel(
  organizationId: string,
  source: ExternalChannelLookupSource,
  id: string,
  newChatId: string
): Promise<{ chatId: string; created: boolean }> {
  const inserted = await db
    .insert(chatSessions)
    .values({
      id: newChatId,
      organizationId,
      title: "New chat",
      messages: [] as unknown as Record<string, unknown>,
      externalChannelSource: source,
      externalChannelId: id,
    })
    .onConflictDoNothing()
    .returning({ id: chatSessions.id });

  if (inserted.length > 0) {
    return { chatId: newChatId, created: true };
  }

  const existing = await getChatSessionByExternalChannel(
    organizationId,
    source,
    id
  );

  if (!existing) {
    throw new Error(
      "Chat insert conflicted but no matching external-channel chat found"
    );
  }

  return { chatId: existing.chatId, created: false };
}

export async function getChatSessionByExternalChannel(
  organizationId: string,
  source: ExternalChannelLookupSource,
  id: string
): Promise<ChatSessionSummary | null> {
  const row = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.organizationId, organizationId),
        eq(chatSessions.externalChannelSource, source),
        eq(chatSessions.externalChannelId, id),
        isNull(chatSessions.deletedAt)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) {
    return null;
  }

  return toSessionSummary(row);
}

export async function listChatSessions(
  organizationId: string
): Promise<ChatSessionSummary[]> {
  const rows = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.organizationId, organizationId),
        isNull(chatSessions.deletedAt)
      )
    );

  const sessions = rows.map(toSessionSummary);
  return sortChatSessions(sessions);
}

export async function getActiveChatStream(
  organizationId: string,
  chatId: string
): Promise<string | null> {
  const redis = getChatRedis();
  if (!redis) {
    return null;
  }
  const streamId = await redis.get<string>(
    activeStreamKey(organizationId, chatId)
  );
  return typeof streamId === "string" && streamId.length > 0 ? streamId : null;
}

export async function setActiveChatStream(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  const redis = getChatRedis();
  if (!redis) {
    return;
  }
  await redis.set(activeStreamKey(organizationId, chatId), streamId);
}

export async function clearActiveChatStream(
  organizationId: string,
  chatId: string
) {
  const redis = getChatRedis();
  if (!redis) {
    return;
  }
  await redis.del(activeStreamKey(organizationId, chatId));
}

export async function setChatAbortFlag(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  const redis = getChatRedis();
  if (!redis) {
    return;
  }
  await redis.set(abortFlagKey(organizationId, chatId, streamId), "1", {
    ex: CHAT_ABORT_FLAG_TTL_SECONDS,
  });
}

export async function isChatAborted(
  organizationId: string,
  chatId: string,
  streamId: string
): Promise<boolean> {
  const redis = getChatRedis();
  if (!redis) {
    return false;
  }
  const value = await redis.get<string>(
    abortFlagKey(organizationId, chatId, streamId)
  );
  return value === "1";
}

export async function clearChatAbortFlag(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  const redis = getChatRedis();
  if (!redis) {
    return;
  }
  await redis.del(abortFlagKey(organizationId, chatId, streamId));
}

export async function setLastResponseStopped(
  organizationId: string,
  chatId: string
) {
  const redis = getChatRedis();
  if (!redis) {
    return;
  }
  await redis.set(lastStoppedKey(organizationId, chatId), "1", {
    ex: CHAT_LAST_STOPPED_TTL_SECONDS,
  });
}

export async function getLastResponseStopped(
  organizationId: string,
  chatId: string
): Promise<boolean> {
  const redis = getChatRedis();
  if (!redis) {
    return false;
  }
  const value = await redis.get<string>(lastStoppedKey(organizationId, chatId));
  return value === "1";
}

export async function clearLastResponseStopped(
  organizationId: string,
  chatId: string
) {
  const redis = getChatRedis();
  if (!redis) {
    return;
  }
  await redis.del(lastStoppedKey(organizationId, chatId));
}

export async function renameChatSession(
  organizationId: string,
  chatId: string,
  title: string
): Promise<ChatSessionSummary | null> {
  const nextTitle = normalizeChatTitle(title);

  const rows = await db
    .update(chatSessions)
    .set({ title: nextTitle })
    .where(
      and(
        eq(chatSessions.id, chatId),
        eq(chatSessions.organizationId, organizationId),
        isNull(chatSessions.deletedAt)
      )
    )
    .returning();

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toSessionSummary(row);
}

export async function setChatSessionPinned(
  organizationId: string,
  chatId: string,
  pinned: boolean
): Promise<ChatSessionSummary | null> {
  const rows = await db
    .update(chatSessions)
    .set({ pinnedAt: pinned ? new Date() : null })
    .where(
      and(
        eq(chatSessions.id, chatId),
        eq(chatSessions.organizationId, organizationId),
        isNull(chatSessions.deletedAt)
      )
    )
    .returning();

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toSessionSummary(row);
}

function collectFileUrlsFromMessages(messages: UIMessage[]): string[] {
  const urls: string[] = [];
  for (const message of messages) {
    if (!Array.isArray(message.parts)) {
      continue;
    }
    for (const part of message.parts) {
      if (
        part.type === "file" &&
        typeof (part as { url?: unknown }).url === "string"
      ) {
        urls.push((part as { url: string }).url);
      }
    }
  }
  return urls;
}

export async function purgeOrganizationChatData(
  organizationId: string
): Promise<{ fileUrls: string[] }> {
  const rows = await db
    .select({ messages: chatSessions.messages })
    .from(chatSessions)
    .where(eq(chatSessions.organizationId, organizationId));

  const fileUrls: string[] = [];

  for (const row of rows) {
    const messages = row.messages as UIMessage[];
    fileUrls.push(...collectFileUrlsFromMessages(messages));
  }

  await db
    .delete(chatSessions)
    .where(eq(chatSessions.organizationId, organizationId));

  return { fileUrls };
}

export async function deleteChatSession(
  organizationId: string,
  chatId: string
): Promise<boolean> {
  const rows = await db
    .update(chatSessions)
    .set({
      deletedAt: new Date(),
      messages: [] as unknown as Record<string, unknown>,
    })
    .where(
      and(
        eq(chatSessions.id, chatId),
        eq(chatSessions.organizationId, organizationId),
        isNull(chatSessions.deletedAt)
      )
    )
    .returning({ id: chatSessions.id });

  if (rows.length === 0) {
    return false;
  }

  const redis = getChatRedis();
  if (redis) {
    const streamId = await getActiveChatStream(organizationId, chatId);
    await Promise.allSettled([
      clearActiveChatStream(organizationId, chatId),
      redis.del(lastStoppedKey(organizationId, chatId)),
      ...(streamId ? [setChatAbortFlag(organizationId, chatId, streamId)] : []),
    ]);
  }

  return true;
}

function getFirstUserMessage(messages: UIMessage[]): string | null {
  for (const message of messages) {
    if (message.role !== "user" || !Array.isArray(message.parts)) {
      continue;
    }

    const fileNames: string[] = [];
    for (const part of message.parts) {
      if (part.type === "text") {
        const normalized = part.text.replace(/\s+/g, " ").trim();
        if (normalized) {
          return normalized;
        }
      }
      if (part.type === "file") {
        const filename =
          typeof part.filename === "string" ? part.filename.trim() : "";
        if (filename) {
          fileNames.push(filename);
        }
      }
    }

    if (fileNames.length === 1) {
      return fileNames[0] ?? null;
    }

    if (fileNames.length > 1) {
      return `${fileNames[0]} +${fileNames.length - 1} more`;
    }
  }

  return null;
}

function getFallbackTitle(userMessage: string): string {
  return userMessage.length > 60
    ? `${userMessage.slice(0, 57).trimEnd()}...`
    : userMessage;
}

function getChatTitle(messages: UIMessage[]) {
  const text = getFirstUserMessage(messages);
  return text ? getFallbackTitle(text) : null;
}

function firstUserMessageHasText(message: UIMessage): boolean {
  if (message.role !== "user" || !Array.isArray(message.parts)) {
    return false;
  }
  return message.parts.some(
    (part) => part.type === "text" && part.text.trim().length > 0
  );
}

export async function generateAndSetChatTitle(
  organizationId: string,
  chatId: string,
  firstUserMessage: UIMessage
) {
  try {
    const userMessage = getFirstUserMessage([firstUserMessage]);
    if (!userMessage) {
      return;
    }
    const fallbackTitle = getFallbackTitle(userMessage);

    if (!firstUserMessageHasText(firstUserMessage)) {
      await db
        .update(chatSessions)
        .set({ title: normalizeChatTitle(fallbackTitle) })
        .where(
          and(
            eq(chatSessions.id, chatId),
            eq(chatSessions.organizationId, organizationId),
            isNull(chatSessions.deletedAt)
          )
        );
      return;
    }

    const { text } = await generateText({
      model: gateway("openai/gpt-5.4-nano"),
      system: `Generate a short, descriptive title (max 50 chars) for a chat conversation based on the user's first message. Return ONLY the title text, nothing else. No quotes, no prefix. Be specific and concise.`,
      prompt: userMessage,
      maxOutputTokens: 30,
      experimental_telemetry: buildExperimentalTelemetry({
        chatId,
        feature: "chat_title",
        organizationId,
      }),
    });

    const aiTitle = text.replace(/^["']|["']$/g, "").trim();
    const title = normalizeChatTitle(aiTitle || fallbackTitle);

    await db
      .update(chatSessions)
      .set({ title })
      .where(
        and(
          eq(chatSessions.id, chatId),
          eq(chatSessions.organizationId, organizationId),
          isNull(chatSessions.deletedAt)
        )
      );
  } catch (err) {
    console.error("[Chat Title] Generation failed:", err);
  }
}
