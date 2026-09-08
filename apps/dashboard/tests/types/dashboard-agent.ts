import type { UIMessage } from "ai";

export interface AgentChatStreamOptions {
  onFinish: (result: { messages: UIMessage[] }) => Promise<void>;
}
