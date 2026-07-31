import type { appendChatMessageIfMissing } from "@notra/ai/chat/history";

export type MirrorUiMessage = Parameters<typeof appendChatMessageIfMissing>[2];

export interface MirrorTarget {
  organizationId: string;
  chatId: string;
  sessionId: string;
}
