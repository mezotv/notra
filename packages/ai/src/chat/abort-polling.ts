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
  let pollInFlight = false;
  let nextLeaseRefreshAt = Date.now();

  const timer = setInterval(async () => {
    if (stopped || pollInFlight) {
      return;
    }
    pollInFlight = true;
    try {
      if (Date.now() >= nextLeaseRefreshAt) {
        nextLeaseRefreshAt =
          Date.now() + CHAT_ACTIVE_STREAM_REFRESH_INTERVAL_MS;
        const leaseRefreshed = await refreshActiveChatStream(
          organizationId,
          chatId,
          streamId
        );
        if (stopped) {
          return;
        }
        if (!leaseRefreshed) {
          stopped = true;
          clearInterval(timer);
          onAbort();
          return;
        }
      }

      const chatAborted = await isChatAborted(organizationId, chatId, streamId);
      if (stopped) {
        return;
      }
      if (chatAborted) {
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
    } finally {
      pollInFlight = false;
    }
  }, intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
