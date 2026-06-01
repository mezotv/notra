import { CHAT_TITLE_MAX_LENGTH } from "../constants/chat";
import type {
  BuildChatFinishMetadataInput,
  ChatSessionSummary,
} from "../types/chat";

export function buildChatFinishMetadata({
  streamStartedAt,
  firstChunkAt,
  finishedAt,
  partUsage,
  usageSnapshot,
  model,
  requestedModel,
  thinkingLevel,
  requestedThinkingLevel,
}: BuildChatFinishMetadataInput) {
  const ttftMs =
    firstChunkAt !== null ? firstChunkAt - streamStartedAt : undefined;
  const generationDurationMs =
    firstChunkAt !== null ? finishedAt - firstChunkAt : undefined;
  const inputTokens = partUsage?.inputTokens ?? usageSnapshot.inputTokens;
  const outputTokens = partUsage?.outputTokens ?? usageSnapshot.outputTokens;
  const totalTokens = partUsage?.totalTokens ?? usageSnapshot.totalTokens;
  const cacheReadTokens =
    partUsage?.inputTokenDetails?.cacheReadTokens ??
    usageSnapshot.cacheReadTokens;
  const cacheWriteTokens =
    partUsage?.inputTokenDetails?.cacheWriteTokens ??
    usageSnapshot.cacheWriteTokens;
  const tokensPerSecond =
    generationDurationMs &&
    generationDurationMs > 0 &&
    outputTokens &&
    outputTokens > 0
      ? (outputTokens / generationDurationMs) * 1000
      : undefined;

  return {
    model,
    requestedModel,
    thinkingLevel,
    requestedThinkingLevel,
    inputTokens,
    outputTokens,
    totalTokens,
    cacheReadTokens,
    cacheWriteTokens,
    ttftMs,
    generationDurationMs,
    tokensPerSecond,
  };
}

export function normalizeChatTitle(title: string) {
  return title.replace(/\s+/g, " ").trim().slice(0, CHAT_TITLE_MAX_LENGTH);
}

export function formatChatIdFallback(chatId: string) {
  if (chatId.length <= 10) {
    return chatId;
  }
  return `${chatId.slice(0, 6)}…${chatId.slice(-3)}`;
}

export function chatSessionsQueryKey(organizationId: string | undefined) {
  return ["chat-sessions", organizationId] as const;
}

export function chatSessionPath(organizationId: string, chatId: string) {
  return `/api/organizations/${organizationId}/chat/${chatId}`;
}

export function chatSessionsPath(organizationId: string) {
  return `/api/organizations/${organizationId}/chat/sessions`;
}

export function sortChatSessions(sessions: ChatSessionSummary[]) {
  return [...sessions].sort((left, right) => {
    const leftPinnedAt = left.pinnedAt ? Date.parse(left.pinnedAt) : Number.NaN;
    const rightPinnedAt = right.pinnedAt
      ? Date.parse(right.pinnedAt)
      : Number.NaN;

    if (Number.isFinite(leftPinnedAt) || Number.isFinite(rightPinnedAt)) {
      if (!Number.isFinite(leftPinnedAt)) {
        return 1;
      }

      if (!Number.isFinite(rightPinnedAt)) {
        return -1;
      }

      return rightPinnedAt - leftPinnedAt;
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
}
