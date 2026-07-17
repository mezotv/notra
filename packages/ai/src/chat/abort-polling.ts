import {
  CHAT_ABORT_POLL_INTERVAL_MS,
  CHAT_ACTIVE_STREAM_REFRESH_INTERVAL_MS,
} from "../constants/chat";
import type { StartChatAbortPollingArgs } from "../types/chat";
import { isChatAborted, refreshActiveChatStream } from "./history";

export function startChatAbortPolling({
  organizationId,
  chatId,
  streamId,
  onAbort,
  intervalMs = CHAT_ABORT_POLL_INTERVAL_MS,
}: StartChatAbortPollingArgs): () => void {
  let stopped = false;
  let nextLeaseRefreshAt = Date.now();

  const timer = setInterval(async () => {
    if (stopped) {
      return;
    }
    try {
      if (Date.now() >= nextLeaseRefreshAt) {
        const leaseRefreshed = await refreshActiveChatStream(
          organizationId,
          chatId,
          streamId
        );
        if (!leaseRefreshed) {
          stopped = true;
          clearInterval(timer);
          onAbort();
          return;
        }
        nextLeaseRefreshAt =
          Date.now() + CHAT_ACTIVE_STREAM_REFRESH_INTERVAL_MS;
      }

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
