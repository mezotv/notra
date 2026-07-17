import {
  getActiveChatStream,
  getChatSession,
  getChatStreamChannelName,
} from "@notra/ai/chat/history";
import { realtime } from "@notra/ai/realtime";
import type { UIMessageChunk } from "ai";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import type { NextRequest } from "next/server";
import { CHAT_STREAM_MAX_LIFETIME_MS } from "@/constants/chat-stream";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { chatIdParamSchema } from "@/schemas/chat";
import { enforceChatStreamConnectionRatelimit } from "@/utils/chat-stream-ratelimit";

interface RouteContext {
  params: Promise<{ organizationId: string; chatId: string }>;
}

function toSseChunk(chunk: UIMessageChunk) {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { organizationId, chatId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  const chatIdParse = chatIdParamSchema.safeParse(chatId);
  if (!chatIdParse.success) {
    return Response.json(
      { error: "Invalid chat ID", details: chatIdParse.error.issues },
      { status: 400 }
    );
  }

  const safeChatId = chatIdParse.data;
  const session = await getChatSession(organizationId, safeChatId);
  if (!session) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  const activeStreamId = await getActiveChatStream(organizationId, safeChatId);

  if (!activeStreamId) {
    return new Response(null, { status: 204 });
  }

  if (!realtime) {
    return new Response("Realtime not configured", { status: 503 });
  }

  const rateLimited = await enforceChatStreamConnectionRatelimit(
    organizationId,
    auth.context.user.id
  );
  if (rateLimited) {
    return rateLimited;
  }

  const channel = realtime.channel(
    getChatStreamChannelName(organizationId, safeChatId, activeStreamId)
  );

  let unsubscribe: (() => void) | undefined;
  let closeTimeout: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const toChunks = (data: unknown): UIMessageChunk[] =>
    Array.isArray(data) ? (data as UIMessageChunk[]) : [data as UIMessageChunk];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      const close = () => {
        if (closed) {
          return;
        }
        closed = true;
        if (closeTimeout) {
          clearTimeout(closeTimeout);
        }
        unsubscribe?.();
        controller.close();
      };

      closeTimeout = setTimeout(close, CHAT_STREAM_MAX_LIFETIME_MS);

      const emit = (chunk: UIMessageChunk) => {
        if (closed) {
          return true;
        }
        controller.enqueue(encoder.encode(toSseChunk(chunk)));
        return chunk.type === "finish" || chunk.type === "abort";
      };

      const history = await channel.history();

      for (const item of history) {
        if (item.event !== "ai.chunk") {
          continue;
        }

        for (const chunk of toChunks(item.data)) {
          if (emit(chunk)) {
            close();
            return;
          }
        }
      }

      const subscription = await channel.subscribe({
        events: ["ai.chunk"],
        onData: ({ data }) => {
          for (const chunk of toChunks(data)) {
            if (emit(chunk)) {
              close();
              return;
            }
          }
        },
      });
      if (closed) {
        subscription();
        return;
      }
      unsubscribe = subscription;
    },
    cancel() {
      closed = true;
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
      unsubscribe?.();
    },
  });

  return new Response(stream, { headers: UI_MESSAGE_STREAM_HEADERS });
}
