export interface HandleStandaloneChatErrorOptions {
  setChatError: (message: string | null) => void;
  setPendingMessageId: (messageId: string | null) => void;
}
