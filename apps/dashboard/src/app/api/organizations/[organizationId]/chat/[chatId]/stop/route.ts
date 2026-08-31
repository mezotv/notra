import {
  clearActiveChatStream,
  getActiveChatStream,
  getChatSession,
  getChatStreamChannelName,
  setChatAbortFlag,
  setLastResponseStopped,
} from "@notra/ai/chat/history";
import { realtime } from "@notra/ai/realtime";
import { chatIdSchema } from "@notra/ai/schemas/chat";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { trackServerEvent } from "@/lib/analytics/posthog-server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { ratelimit } from "@/utils/ratelimit";

interface RouteContext {
  params: Promise<{ organizationId: string; chatId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
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

  const rateLimitResult = await ratelimit.chatStop.limit(
    `${organizationId}:${auth.context.user.id}`
  );
  if (!rateLimitResult.success) {
    const retryAfter = Math.max(
      0,
      Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  const safeChatId = chatIdParse.data;
  const session = await getChatSession(organizationId, safeChatId);
  if (!session) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  await setLastResponseStopped(organizationId, safeChatId);

  const activeStreamId = await getActiveChatStream(organizationId, safeChatId);

  trackServerEvent({
    event: POSTHOG_EVENTS.CHAT_GENERATION_STOPPED,
    headers: request.headers,
    userId: auth.context.user.id,
    organizationId,
    properties: {
      chat_id: safeChatId,
      had_active_stream: Boolean(activeStreamId),
    },
  });

  if (!activeStreamId) {
    return NextResponse.json({ ok: true, aborted: false });
  }

  await setChatAbortFlag(organizationId, safeChatId, activeStreamId);

  if (realtime) {
    const channel = realtime.channel(
      getChatStreamChannelName(organizationId, safeChatId, activeStreamId)
    );
    try {
      await channel.emit("ai.chunk", {
        type: "abort",
        reason: "user-stopped",
      });
      await channel.emit("ai.chunk", {
        type: "finish",
        finishReason: "stop",
      });
    } catch (error) {
      console.error("[Chat Stop] Failed to emit abort chunk:", {
        organizationId,
        chatId: safeChatId,
        streamId: activeStreamId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await clearActiveChatStream(organizationId, safeChatId, activeStreamId);

  return NextResponse.json({ ok: true, aborted: true });
}
