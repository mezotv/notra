"use client";

import {
  chatSessionResponseSchema,
  chatSessionsListResponseSchema,
} from "@notra/ai/schemas/chat";
import type { ChatSessionSummary } from "@notra/ai/types/chat";
import {
  chatSessionPath,
  chatSessionsPath,
  chatSessionsQueryKey,
  sortChatSessions,
} from "@notra/ai/utils/chat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { useOrganizationsContext } from "@/components/providers/organization-provider";

export function useChatSessions() {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;
  const queryKey = chatSessionsQueryKey(organizationId);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) {
        return [];
      }
      const response = await fetch(chatSessionsPath(organizationId));
      if (!response.ok) {
        return [];
      }
      const parsed = chatSessionsListResponseSchema.safeParse(
        await response.json()
      );
      return parsed.success ? (parsed.data.sessions ?? []) : [];
    },
    enabled: Boolean(organizationId),
    staleTime: 1000 * 60,
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isPending && query.fetchStatus !== "idle",
    organizationId,
    queryKey,
  };
}

export function useChatSessionMutations() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;
  const queryKey = chatSessionsQueryKey(organizationId);
  const renameInFlightRef = useRef<Set<string>>(new Set());

  function replaceSessionInCache(
    chatId: string,
    updater: (session: ChatSessionSummary) => ChatSessionSummary
  ) {
    queryClient.setQueryData<ChatSessionSummary[]>(queryKey, (current = []) =>
      sortChatSessions(
        current.map((item) => (item.chatId === chatId ? updater(item) : item))
      )
    );
  }

  async function renameChat(
    chatId: string,
    nextTitle: string
  ): Promise<boolean> {
    if (!organizationId || renameInFlightRef.current.has(chatId)) {
      return false;
    }

    renameInFlightRef.current.add(chatId);
    const previousSessions =
      queryClient.getQueryData<ChatSessionSummary[]>(queryKey) ?? [];
    replaceSessionInCache(chatId, (item) => ({ ...item, title: nextTitle }));

    try {
      const response = await fetch(chatSessionPath(organizationId, chatId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename chat");
      }

      const parsed = chatSessionResponseSchema.safeParse(await response.json());
      if (parsed.success && parsed.data.session) {
        const updated = parsed.data.session;
        replaceSessionInCache(chatId, () => updated);
      }
      return true;
    } catch {
      queryClient.setQueryData(queryKey, previousSessions);
      toast.error("Failed to rename chat");
      return false;
    } finally {
      renameInFlightRef.current.delete(chatId);
    }
  }

  async function togglePinned(session: ChatSessionSummary): Promise<boolean> {
    if (!organizationId) {
      return false;
    }

    const nextPinned = !session.pinnedAt;
    const previousSessions =
      queryClient.getQueryData<ChatSessionSummary[]>(queryKey) ?? [];
    const nextPinnedAt = nextPinned ? new Date().toISOString() : null;

    replaceSessionInCache(session.chatId, (item) => ({
      ...item,
      pinnedAt: nextPinnedAt,
    }));

    try {
      const response = await fetch(
        chatSessionPath(organizationId, session.chatId),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinned: nextPinned }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update pin state");
      }

      const parsed = chatSessionResponseSchema.safeParse(await response.json());
      if (parsed.success && parsed.data.session) {
        const updated = parsed.data.session;
        replaceSessionInCache(session.chatId, () => updated);
      }
      return true;
    } catch {
      queryClient.setQueryData(queryKey, previousSessions);
      toast.error("Failed to update chat pin");
      return false;
    }
  }

  async function deleteChat(chatId: string): Promise<boolean> {
    if (!organizationId) {
      return false;
    }

    try {
      const response = await fetch(chatSessionPath(organizationId, chatId), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      queryClient.setQueryData<ChatSessionSummary[]>(queryKey, (current = []) =>
        current.filter((item) => item.chatId !== chatId)
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({
          queryKey: ["chat-history", organizationId, chatId],
        }),
      ]);

      toast.success("Chat deleted");
      return true;
    } catch {
      toast.error("Failed to delete chat");
      return false;
    }
  }

  return { renameChat, togglePinned, deleteChat };
}
