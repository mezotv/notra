import type { ChatUIMessage } from "@notra/ai/types/chat";

export interface SlackRelayTarget {
  teamId: string;
  channelId: string;
  threadTs: string;
}

export interface SlackMirrorComposerProps {
  organizationId: string;
  chatId: string;
  onSent: (message: ChatUIMessage | null) => void;
}
