import {
  getActiveChatStream,
  getChatSession,
  getChatStreamChannelName,
} from "@notra/ai/chat/history";
import { CHAT_STREAM_MAX_LIFETIME_MS } from "@notra/ai/constants/chat";
import { realtime } from "@notra/ai/realtime";
import { chatIdSchema } from "@notra/ai/schemas/chat";
import type { UIMessageChunk } from "ai";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { ratelimit } from "@/utils/ratelimit";

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

  const chatIdParse = chatIdSchema.safeParse(chatId);
  if (!chatIdParse.success) {
    return NextResponse.json(
      { error: "Invalid chat ID", details: chatIdParse.error.issues },
      { status: 400 }
    );
  }

  const safeChatId = chatIdParse.data;
  const { success: withinLimit, reset } = await ratelimit.chatStream.limit(
    `${organizationId}:${auth.context.user.id}`
  );
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Rate limit exceeded", reset },
      { status: 429 }
    );
  }

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

  const channel = realtime.channel(
    getChatStreamChannelName(organizationId, safeChatId, activeStreamId)
  );

  let unsubscribe: (() => void) | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
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
        if (timeout) {
          clearTimeout(timeout);
        }
        unsubscribe?.();
        controller.close();
      };

      timeout = setTimeout(close, CHAT_STREAM_MAX_LIFETIME_MS);

      const emit = (chunk: UIMessageChunk) => {
        if (closed) {
          return true;
        }
        controller.enqueue(encoder.encode(toSseChunk(chunk)));
        return chunk.type === "finish" || chunk.type === "abort";
      };

      try {
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

        unsubscribe = await channel.subscribe({
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
          unsubscribe();
        }
      } catch (error) {
        closed = true;
        if (timeout) {
          clearTimeout(timeout);
        }
        unsubscribe?.();
        throw error;
      }
    },
    cancel() {
      closed = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      unsubscribe?.();
    },
  });

  return new Response(stream, { headers: UI_MESSAGE_STREAM_HEADERS });
}
