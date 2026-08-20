export function updateWasStoppedByUser(
  value: boolean,
  ref: { current: boolean },
  setState: (value: boolean) => void
) {
  ref.current = value;
  setState(value);
}

export function clearPendingChatClientState({
  setChatError,
  setPendingMessageId,
  setQueuedMessages,
}: {
  setChatError: (error: string | null) => void;
  setPendingMessageId: (id: string | null) => void;
  setQueuedMessages: (messages: []) => void;
}) {
  setPendingMessageId(null);
  setChatError(null);
  setQueuedMessages([]);
}

export function resetNewChatClientState({
  hasUpdatedUrlRef,
  setChatError,
  setContext,
  setGeneratedChatId,
  setHasCustomizedContext,
  setMessages,
  setPendingMessageId,
  setQueuedMessages,
  setWasStoppedByUser,
  wasStoppedByUserRef,
}: {
  hasUpdatedUrlRef: { current: boolean };
  setChatError: (error: string | null) => void;
  setContext: (context: []) => void;
  setGeneratedChatId: (id: string) => void;
  setHasCustomizedContext: (value: boolean) => void;
  setMessages: (messages: []) => void;
  setPendingMessageId: (id: string | null) => void;
  setQueuedMessages: (messages: []) => void;
  setWasStoppedByUser: (value: boolean) => void;
  wasStoppedByUserRef: { current: boolean };
}) {
  clearPendingChatClientState({
    setChatError,
    setPendingMessageId,
    setQueuedMessages,
  });
  hasUpdatedUrlRef.current = false;
  updateWasStoppedByUser(false, wasStoppedByUserRef, setWasStoppedByUser);
  setMessages([]);
  setContext([]);
  setHasCustomizedContext(false);
  setGeneratedChatId(crypto.randomUUID());
}
