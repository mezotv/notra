import { gateway } from "@notra/ai/gateway";
import type { UIMessage } from "ai";
import { generateText } from "ai";
import {
  CHAT_ABORT_FLAG_TTL_SECONDS,
  CHAT_DELETION_TOMBSTONE_TTL_SECONDS,
} from "@/constants/chat";
import type { ChatSessionSummary } from "@/types/chat";
import { normalizeChatTitle, sortChatSessions } from "@/utils/chat";
import { redis } from "./redis";

function historyKey(organizationId: string, chatId: string) {
  return `chat:history:${organizationId}:${chatId}`;
}

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

function deletedChatKey(organizationId: string, chatId: string) {
  return `chat:deleted:${organizationId}:${chatId}`;
}

function chatStateVersionKey(organizationId: string, chatId: string) {
  return `chat:stateVersion:${organizationId}:${chatId}`;
}

function abortFlagKeyPrefix(organizationId: string, chatId: string) {
  return `chat:abort:${organizationId}:${chatId}:`;
}

function sessionsKey(organizationId: string) {
  return `chat:sessions:${organizationId}`;
}

function sessionMetaKey(organizationId: string, chatId: string) {
  return `chat:session:${organizationId}:${chatId}`;
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

const CHAT_SESSION_WRITE_MAX_ATTEMPTS = 3;

const WRITE_CHAT_HISTORY_SCRIPT = `
local deleted = redis.call("GET", KEYS[1])
if deleted == "1" then
  return 0
end

local currentVersion = tonumber(redis.call("GET", KEYS[2]) or "0")
local expectedVersion = tonumber(ARGV[1])
if currentVersion ~= expectedVersion then
  return 0
end

if ARGV[2] == "replace" then
  redis.call("DEL", KEYS[3])
end

local entryCount = tonumber(ARGV[6])
local entryIndex = 7

for _ = 1, entryCount do
  redis.call("ZADD", KEYS[3], tonumber(ARGV[entryIndex]), ARGV[entryIndex + 1])
  entryIndex = entryIndex + 2
end

redis.call("INCR", KEYS[2])
redis.call("SET", KEYS[4], ARGV[3])
redis.call("ZADD", KEYS[5], tonumber(ARGV[4]), ARGV[5])

return 1
`;

const UPDATE_EXISTING_CHAT_METADATA_SCRIPT = `
local deleted = redis.call("GET", KEYS[1])
if deleted == "1" then
  return 0
end

local currentVersion = tonumber(redis.call("GET", KEYS[2]) or "0")
local expectedVersion = tonumber(ARGV[1])
if currentVersion ~= expectedVersion then
  return 0
end

if redis.call("GET", KEYS[3]) == false then
  return 0
end

redis.call("INCR", KEYS[2])
redis.call("SET", KEYS[3], ARGV[2])
redis.call("ZADD", KEYS[4], tonumber(ARGV[3]), ARGV[4])

return 1
`;

const DELETE_CHAT_SESSION_SCRIPT = `
if redis.call("GET", KEYS[1]) == false then
  return 0
end

local activeStreamId = redis.call("GET", KEYS[4])

redis.call("INCR", KEYS[7])
redis.call("SET", KEYS[2], "1", "EX", tonumber(ARGV[2]))

if activeStreamId then
  redis.call("SET", ARGV[4] .. activeStreamId, "1", "EX", tonumber(ARGV[3]))
end

redis.call("DEL", KEYS[3], KEYS[1], KEYS[4], KEYS[5])
redis.call("ZREM", KEYS[6], ARGV[1])

return 1
`;

export async function isChatDeleted(organizationId: string, chatId: string) {
  if (!redis) {
    return false;
  }
  const value = await redis.get<string>(deletedChatKey(organizationId, chatId));
  return value === "1";
}

async function getChatStateVersion(organizationId: string, chatId: string) {
  if (!redis) {
    return 0;
  }
  const value = await redis.get<string | number>(
    chatStateVersionKey(organizationId, chatId)
  );
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseChatSessionSummary(
  value: ChatSessionSummary | string | false | null | undefined
): ChatSessionSummary | null {
  if (value === false || value == null) {
    return null;
  }
  return typeof value === "string" ? JSON.parse(value) : value;
}

function buildSessionMetadata(
  chatId: string,
  messages: UIMessage[],
  timestamp: number,
  existing: ChatSessionSummary | null
): ChatSessionSummary {
  return {
    chatId,
    title:
      existing?.title ??
      normalizeChatTitle(getChatTitle(messages) ?? "New chat"),
    createdAt: existing?.createdAt ?? new Date(timestamp).toISOString(),
    updatedAt: new Date(timestamp).toISOString(),
    pinnedAt: existing?.pinnedAt ?? null,
  };
}

async function getChatSessionSnapshot(
  organizationId: string,
  chatId: string
): Promise<{
  expectedVersion: number;
  session: ChatSessionSummary | null;
}> {
  const [expectedVersion, raw] = await Promise.all([
    getChatStateVersion(organizationId, chatId),
    redis?.get<ChatSessionSummary | string | false>(
      sessionMetaKey(organizationId, chatId)
    ),
  ]);

  return {
    expectedVersion,
    session: parseChatSessionSummary(raw),
  };
}

async function writeChatHistory(
  organizationId: string,
  chatId: string,
  messages: UIMessage[],
  mode: "append" | "replace"
) {
  if (!redis) {
    return false;
  }

  for (
    let attempt = 0;
    attempt < CHAT_SESSION_WRITE_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const { expectedVersion, session: existing } = await getChatSessionSnapshot(
      organizationId,
      chatId
    );
    const timestamp = Date.now();
    const session = buildSessionMetadata(chatId, messages, timestamp, existing);

    const args = [
      String(expectedVersion),
      mode,
      JSON.stringify(session),
      String(timestamp),
      chatId,
      String(messages.length),
      ...messages.flatMap((message, index) => [
        String(timestamp + index),
        JSON.stringify(message),
      ]),
    ];

    const result = Number(
      await redis.eval(
        WRITE_CHAT_HISTORY_SCRIPT,
        [
          deletedChatKey(organizationId, chatId),
          chatStateVersionKey(organizationId, chatId),
          historyKey(organizationId, chatId),
          sessionMetaKey(organizationId, chatId),
          sessionsKey(organizationId),
        ],
        args
      )
    );

    if (result === 1) {
      return true;
    }
  }

  return false;
}

async function updateExistingChatSessionMetadata(
  organizationId: string,
  chatId: string,
  buildNextSession: (session: ChatSessionSummary) => ChatSessionSummary | null
): Promise<ChatSessionSummary | null> {
  if (!redis) {
    return null;
  }

  for (
    let attempt = 0;
    attempt < CHAT_SESSION_WRITE_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const snapshot = await getChatSessionSnapshot(organizationId, chatId);
    if (!snapshot.session) {
      return null;
    }

    const nextSession = buildNextSession(snapshot.session);
    if (!nextSession) {
      return snapshot.session;
    }

    const result = Number(
      await redis.eval(
        UPDATE_EXISTING_CHAT_METADATA_SCRIPT,
        [
          deletedChatKey(organizationId, chatId),
          chatStateVersionKey(organizationId, chatId),
          sessionMetaKey(organizationId, chatId),
          sessionsKey(organizationId),
        ],
        [
          String(snapshot.expectedVersion),
          JSON.stringify(nextSession),
          String(Date.parse(nextSession.updatedAt)),
          chatId,
        ]
      )
    );

    if (result === 1) {
      return nextSession;
    }
  }

  return null;
}

export async function saveChatMessage(
  organizationId: string,
  chatId: string,
  message: UIMessage
) {
  if (!redis) {
    return;
  }
  await writeChatHistory(organizationId, chatId, [message], "append");
}

export async function saveChatMessages(
  organizationId: string,
  chatId: string,
  messages: UIMessage[]
) {
  if (!redis) {
    return;
  }
  await writeChatHistory(organizationId, chatId, messages, "append");
}

export async function replaceChatHistory(
  organizationId: string,
  chatId: string,
  messages: UIMessage[]
) {
  if (!redis) {
    return;
  }
  await writeChatHistory(organizationId, chatId, messages, "replace");
}

export async function loadChatHistory(
  organizationId: string,
  chatId: string
): Promise<UIMessage[]> {
  if (!redis) {
    return [];
  }
  if (await isChatDeleted(organizationId, chatId)) {
    return [];
  }
  const raw = await redis.zrange<string[]>(
    historyKey(organizationId, chatId),
    0,
    -1
  );
  return raw.map((entry) =>
    typeof entry === "string" ? JSON.parse(entry) : entry
  );
}

export async function listChatSessions(
  organizationId: string
): Promise<ChatSessionSummary[]> {
  if (!redis) {
    return [];
  }
  const redisClient = redis;

  const chatIds = await redisClient.zrange<string[]>(
    sessionsKey(organizationId),
    0,
    -1
  );
  const orderedChatIds = [...chatIds].reverse();

  const sessions = await Promise.all(
    orderedChatIds.map(async (chatId) => {
      const raw = await redisClient.get<ChatSessionSummary | string>(
        sessionMetaKey(organizationId, chatId)
      );

      if (!raw) {
        return null;
      }

      const session = typeof raw === "string" ? JSON.parse(raw) : raw;
      return {
        chatId,
        title: session.title,
        updatedAt: session.updatedAt,
        createdAt: session.createdAt,
        pinnedAt: session.pinnedAt ?? null,
      } satisfies ChatSessionSummary;
    })
  );

  return sortChatSessions(
    sessions.filter(
      (session): session is ChatSessionSummary => session !== null
    )
  );
}

export async function getActiveChatStream(
  organizationId: string,
  chatId: string
): Promise<string | null> {
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
  if (!redis) {
    return;
  }
  await redis.set(activeStreamKey(organizationId, chatId), streamId);
}

export async function clearActiveChatStream(
  organizationId: string,
  chatId: string
) {
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
  if (!redis) {
    return;
  }
  await redis.del(abortFlagKey(organizationId, chatId, streamId));
}

export async function setLastResponseStopped(
  organizationId: string,
  chatId: string
) {
  if (!redis) {
    return;
  }
  await redis.set(lastStoppedKey(organizationId, chatId), "1");
}

export async function getLastResponseStopped(
  organizationId: string,
  chatId: string
): Promise<boolean> {
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
  if (!redis) {
    return null;
  }

  const nextTitle = normalizeChatTitle(title);
  return updateExistingChatSessionMetadata(
    organizationId,
    chatId,
    (session) => ({
      ...session,
      title: nextTitle,
    })
  );
}

export async function setChatSessionPinned(
  organizationId: string,
  chatId: string,
  pinned: boolean
): Promise<ChatSessionSummary | null> {
  if (!redis) {
    return null;
  }

  return updateExistingChatSessionMetadata(
    organizationId,
    chatId,
    (session) => ({
      ...session,
      pinnedAt: pinned ? new Date().toISOString() : null,
    })
  );
}

export async function deleteChatSession(
  organizationId: string,
  chatId: string
): Promise<boolean> {
  if (!redis) {
    return false;
  }

  const metaKey = sessionMetaKey(organizationId, chatId);
  const existing = await redis.get<ChatSessionSummary | string>(metaKey);

  if (!existing) {
    return false;
  }

  const deleted = Number(
    await redis.eval(
      DELETE_CHAT_SESSION_SCRIPT,
      [
        metaKey,
        deletedChatKey(organizationId, chatId),
        historyKey(organizationId, chatId),
        activeStreamKey(organizationId, chatId),
        lastStoppedKey(organizationId, chatId),
        sessionsKey(organizationId),
        chatStateVersionKey(organizationId, chatId),
      ],
      [
        chatId,
        String(CHAT_DELETION_TOMBSTONE_TTL_SECONDS),
        String(CHAT_ABORT_FLAG_TTL_SECONDS),
        abortFlagKeyPrefix(organizationId, chatId),
      ]
    )
  );

  return deleted === 1;
}

function getFirstUserMessage(messages: UIMessage[]): string | null {
  for (const message of messages) {
    if (message.role !== "user" || !Array.isArray(message.parts)) {
      continue;
    }

    for (const part of message.parts) {
      if (part.type === "text") {
        const normalized = part.text.replace(/\s+/g, " ").trim();
        if (normalized) {
          return normalized;
        }
      }
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

export async function generateAndSetChatTitle(
  organizationId: string,
  chatId: string,
  userMessage: string
) {
  try {
    const fallbackTitle = getFallbackTitle(userMessage);

    const { text } = await generateText({
      model: gateway("openai/gpt-5.4-nano"),
      system: `Generate a short, descriptive title (max 50 chars) for a chat conversation based on the user's first message. Return ONLY the title text, nothing else. No quotes, no prefix. Be specific and concise.`,
      prompt: userMessage,
      maxOutputTokens: 30,
    });

    const aiTitle = text.replace(/^["']|["']$/g, "").trim();
    const title = normalizeChatTitle(aiTitle || fallbackTitle);

    await updateExistingChatSessionMetadata(
      organizationId,
      chatId,
      (session) => ({ ...session, title, updatedAt: new Date().toISOString() })
    );
  } catch (err) {
    console.error("[Chat Title] Generation failed:", err);
  }
}
