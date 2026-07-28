import type { ChatStatus, UIMessage } from "ai";

export interface ContentChatActivityPanelProps {
  messages: UIMessage[];
  status: ChatStatus;
  onClose: () => void;
}

export interface ContentChatActivityMessageProps {
  message: UIMessage;
  status: ChatStatus;
}
