"use client";

import { useChat } from "@ai-sdk/react";
import {
  chatSessionsListResponseSchema,
  uiMessageSchema,
} from "@notra/ai/schemas/chat";
import type { ChatSessionSummary } from "@notra/ai/types/chat";
import {
  dashboardAgentChatHistoryPath,
  dashboardAgentChatHistoryQueryKey,
  dashboardAgentChatSessionsPath,
  dashboardAgentChatSessionsQueryKey,
} from "@notra/ai/utils/chat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

import ChatInput from "@/components/chat-input";
import { ChatSuggestions } from "@/components/chat/chat-suggestions";
import { ContentChatActivityPanel } from "@/components/content/content-chat-activity-panel";
import { useDashboardAgent } from "@/components/dashboard/dashboard-agent-context";
import { RightPanelPortal } from "@/components/dashboard/right-panel-portal";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { DASHBOARD_AGENT_SUGGESTIONS } from "@/constants/chat-suggestions";
import {
  DASHBOARD_AGENT_CHAT_ERROR_TOAST,
  DASHBOARD_AGENT_CHAT_PLACEHOLDER,
  DASHBOARD_AGENT_PANEL_CHAT_CLASSNAME,
  DASHBOARD_AGENT_PANEL_CLASSNAME,
  DASHBOARD_AGENT_PANEL_FRAME_CLASSNAME,
  DASHBOARD_AGENT_PANEL_FRAME_CLOSED_CLASSNAME,
  DASHBOARD_AGENT_PANEL_FRAME_OPEN_CLASSNAME,
  DASHBOARD_AGENT_PANEL_OPEN_WIDTH_CLASSNAME,
  DASHBOARD_AGENT_TITLE,
} from "@/constants/dashboard-agent";
import { localStorageKeys } from "@/constants/storage";
import { emitAutumnRefresh } from "@/lib/billing/autumn-refresh";
import { cn } from "@/lib/utils";
import type { DashboardAgentChatProps } from "@/types/components/dashboard-agent";
import { handleStandaloneChatError } from "@/utils/chat-error";

function DashboardAgentChat({
  organizationId,
  organizationSlug,
  onClose,
}: DashboardAgentChatProps) {
  const queryClient = useQueryClient();
  const [chatInputValue, setChatInputValue] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState(() => crypto.randomUUID());
  const [isHydratingHistory, setIsHydratingHistory] = useState(false);
  const messagesRef = useRef<UIMessage[]>([]);
  const isAgentBusyRef = useRef(false);

  const sessionsQuery = useQuery<ChatSessionSummary[]>({
    queryKey: dashboardAgentChatSessionsQueryKey(organizationId),
    queryFn: async () => {
      const response = await fetch(
        dashboardAgentChatSessionsPath(organizationId)
      );
      if (!response.ok) {
        throw new Error("Failed to load agent chats");
      }
      const parsed = chatSessionsListResponseSchema.safeParse(
        await response.json()
      );
      if (!parsed.success) {
        throw new Error("Invalid agent chat sessions response");
      }
      return parsed.data.sessions ?? [];
    },
    staleTime: 60_000,
  });
  const sessions = sessionsQuery.data ?? [];

  const { messages, sendMessage, setMessages, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/organizations/${organizationId}/dashboard-agent/chat`,
    }),
    onFinish: () => {
      emitAutumnRefresh();
      if (activeChatId) {
        queryClient.setQueryData(
          dashboardAgentChatHistoryQueryKey(organizationId, activeChatId),
          messagesRef.current
        );
      }
      queryClient
        .invalidateQueries({
          queryKey: dashboardAgentChatSessionsQueryKey(organizationId),
        })
        .catch((invalidateError) => {
          console.error(
            "Failed to refresh agent chat sessions",
            invalidateError
          );
        });
      isAgentBusyRef.current = false;
    },
    onError: (err) => {
      isAgentBusyRef.current = false;
      queryClient
        .invalidateQueries({
          queryKey: dashboardAgentChatSessionsQueryKey(organizationId),
        })
        .catch((invalidateError) => {
          console.error(
            "Failed to refresh agent chat sessions",
            invalidateError
          );
        });
      queryClient
        .invalidateQueries({
          queryKey: dashboardAgentChatHistoryQueryKey(
            organizationId,
            activeChatId
          ),
        })
        .catch((invalidateError) => {
          console.error(
            "Failed to refresh agent chat history",
            invalidateError
          );
        });

      const { isUsageLimit } = handleStandaloneChatError(err, {
        setChatError,
      });
      if (!isUsageLimit) {
        toast.error(DASHBOARD_AGENT_CHAT_ERROR_TOAST);
      }
    },
  });

  const isAgentBusy = status === "streaming" || status === "submitted";
  useLayoutEffect(() => {
    messagesRef.current = messages;
    isAgentBusyRef.current = isAgentBusy || isHydratingHistory;
  }, [isAgentBusy, isHydratingHistory, messages]);

  const handleSelectChat = useCallback(
    async (chatId: string) => {
      if (isAgentBusyRef.current || chatId === activeChatId) {
        return;
      }
      isAgentBusyRef.current = true;
      setIsHydratingHistory(true);
      try {
        const history = await queryClient.fetchQuery({
          queryKey: dashboardAgentChatHistoryQueryKey(organizationId, chatId),
          queryFn: async () => {
            const response = await fetch(
              dashboardAgentChatHistoryPath(organizationId, chatId)
            );
            if (!response.ok) {
              throw new Error("Failed to load agent chat history");
            }
            const payload = await response.json();
            return uiMessageSchema.array().parse(payload?.messages);
          },
          staleTime: 0,
        });
        setChatInputValue("");
        setChatError(null);
        setMessages(history);
        setActiveChatId(chatId);
      } catch {
        toast.error("Failed to load agent chat history. Try again.");
      }
      setIsHydratingHistory(false);
      isAgentBusyRef.current = false;
    },
    [activeChatId, organizationId, queryClient, setMessages]
  );

  const handleNewChat = useCallback(() => {
    if (isAgentBusyRef.current) {
      return;
    }
    setChatInputValue("");
    setChatError(null);
    setMessages([]);
    setActiveChatId(crypto.randomUUID());
  }, [setMessages]);

  const handleSend = useCallback(
    async (instruction: string) => {
      if (!activeChatId || isAgentBusyRef.current) {
        return;
      }
      isAgentBusyRef.current = true;
      await sendMessage(
        { text: instruction },
        {
          body: {
            chatId: activeChatId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }
      );
    },
    [activeChatId, sendMessage]
  );

  const handleSuggestionSelect = useCallback((prompt: string) => {
    setChatInputValue(prompt);
  }, []);

  const isChatDisabled = isHydratingHistory;
  const showExamplePrompts =
    messages.length === 0 && !isAgentBusy && !isHydratingHistory;

  return (
    <ContentChatActivityPanel
      activeChatId={activeChatId}
      isHistoryLoading={sessionsQuery.isPending || isHydratingHistory}
      messages={messages}
      onClose={onClose}
      onNewChat={handleNewChat}
      onSelectChat={handleSelectChat}
      sessions={sessions}
      status={status}
      title={DASHBOARD_AGENT_TITLE}
    >
      {showExamplePrompts ? (
        <div className="px-2">
          <ChatSuggestions
            disabled={isChatDisabled}
            dismissStorageKey={
              localStorageKeys.dashboardAgentSuggestionsDismissed
            }
            hidden={chatInputValue.trim().length > 0}
            layout="list"
            onSelect={handleSuggestionSelect}
            rotate
            suggestions={DASHBOARD_AGENT_SUGGESTIONS}
          />
        </div>
      ) : null}
      <div className="shrink-0 p-2 pt-1">
        <ChatInput
          disabled={isChatDisabled}
          error={chatError}
          isLoading={isAgentBusy}
          onClearError={() => setChatError(null)}
          onSend={handleSend}
          onStop={stop}
          onValueChange={setChatInputValue}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          placeholder={DASHBOARD_AGENT_CHAT_PLACEHOLDER}
          value={chatInputValue}
        />
      </div>
    </ContentChatActivityPanel>
  );
}

export function DashboardAgentHost() {
  const { open, hasOpened, setOpen } = useDashboardAgent();
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const organizationSlug = activeOrganization?.slug ?? "";

  if (!organizationId) {
    return null;
  }

  return (
    <RightPanelPortal>
      <aside
        aria-hidden={!open}
        className={cn(
          DASHBOARD_AGENT_PANEL_CLASSNAME,
          open ? DASHBOARD_AGENT_PANEL_OPEN_WIDTH_CLASSNAME : "w-0"
        )}
        inert={open ? undefined : true}
      >
        <div
          className={cn(
            DASHBOARD_AGENT_PANEL_FRAME_CLASSNAME,
            open
              ? DASHBOARD_AGENT_PANEL_FRAME_OPEN_CLASSNAME
              : DASHBOARD_AGENT_PANEL_FRAME_CLOSED_CLASSNAME
          )}
        >
          {hasOpened ? (
            <div className={DASHBOARD_AGENT_PANEL_CHAT_CLASSNAME}>
              <DashboardAgentChat
                key={organizationId}
                onClose={() => setOpen(false)}
                organizationId={organizationId}
                organizationSlug={organizationSlug}
              />
            </div>
          ) : null}
        </div>
      </aside>
    </RightPanelPortal>
  );
}
