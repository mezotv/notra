import type { ChatSessionSummary } from "@notra/ai/types/chat";
import type { ChatStatus, UIMessage } from "ai";
import type { ReactNode } from "react";

export interface ContentChatActivityPanelProps {
  messages: UIMessage[];
  sessions: ChatSessionSummary[];
  activeChatId: string | null;
  isHistoryLoading: boolean;
  status: ChatStatus;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onClose: () => void;
  children?: ReactNode;
}

export interface ContentChatActivityMessageProps {
  message: UIMessage;
  status: ChatStatus;
}
