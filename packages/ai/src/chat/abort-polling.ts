import { CHAT_ABORT_POLL_INTERVAL_MS } from "../constants/chat";
import type { StartChatAbortPollingArgs } from "../types/chat";
import { isChatAborted } from "./history";

export function startChatAbortPolling({
  organizationId,
  chatId,
  streamId,
  onAbort,
  intervalMs = CHAT_ABORT_POLL_INTERVAL_MS,
}: StartChatAbortPollingArgs): () => void {
  let stopped = false;

  const timer = setInterval(async () => {
    if (stopped) {
      return;
    }
    try {
      if (await isChatAborted(organizationId, chatId, streamId)) {
        stopped = true;
        clearInterval(timer);
        onAbort();
      }
    } catch (error) {
      console.error("[Chat Abort Poll] Error:", {
        organizationId,
        chatId,
        streamId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
