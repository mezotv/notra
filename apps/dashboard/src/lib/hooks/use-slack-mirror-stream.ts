"use client";

import { uiMessageSchema } from "@notra/ai/schemas/chat";
import type { ChatUIMessage } from "@notra/ai/types/chat";
import { useEffect, useRef } from "react";

export function useSlackMirrorStream(
  organizationId: string,
  chatId: string | null,
  enabled: boolean,
  onMessage: (message: ChatUIMessage) => void
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!(enabled && chatId && organizationId)) {
      return;
    }

    const source = new EventSource(
      `/api/organizations/${organizationId}/chat/${encodeURIComponent(chatId)}/mirror-stream`
    );

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (uiMessageSchema.safeParse(data).success) {
          onMessageRef.current(data);
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
