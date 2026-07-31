"use client";

import { uiMessageSchema } from "@notra/ai/schemas/chat";
import type { ChatUIMessage, MirrorChatStatus } from "@notra/ai/types/chat";
import { useEffect, useRef } from "react";

export function useSlackMirrorStream(
  organizationId: string,
  chatId: string | null,
  enabled: boolean,
  onMessage: (message: ChatUIMessage) => void,
  onStatus: (status: MirrorChatStatus) => void
) {
  const onMessageRef = useRef(onMessage);
  const onStatusRef = useRef(onStatus);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onStatusRef.current = onStatus;
  }, [onMessage, onStatus]);

  useEffect(() => {
    if (!(enabled && chatId && organizationId)) {
      return;
    }

    const source = new EventSource(
      `/api/organizations/${organizationId}/chat/${encodeURIComponent(chatId)}/mirror-stream`
    );

    source.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope?.event === "status") {
          const status = envelope?.data?.status;
          if (status === "working" || status === "idle") {
            onStatusRef.current(status);
          }
          return;
        }
        if (
          envelope?.event === "message" &&
          uiMessageSchema.safeParse(envelope.data).success
        ) {
          onMessageRef.current(envelope.data);
        }
      } catch {
        return;
      }
    };

    return () => {
      source.close();
    };
  }, [organizationId, chatId, enabled]);
}
