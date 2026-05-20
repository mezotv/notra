import {
  clearActiveChatStream,
  getActiveChatStream,
  getChatSession,
  getChatStreamChannelName,
  setChatAbortFlag,
  setLastResponseStopped,
} from "@notra/ai/chat/history";
import { realtime } from "@notra/ai/realtime";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withOrganizationAuth } from "@/lib/auth/organization";

interface RouteContext {
  params: Promise<{ organizationId: string; chatId: string }>;
}

const chatIdParamSchema = z.string().uuid();

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { organizationId, chatId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  const chatIdParse = chatIdParamSchema.safeParse(chatId);
  if (!chatIdParse.success) {
    return NextResponse.json(
      { error: "Invalid chat ID", details: chatIdParse.error.issues },
      { status: 400 }
    );
  }

  const safeChatId = chatIdParse.data;
  const session = await getChatSession(organizationId, safeChatId);
  if (!session) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  await setLastResponseStopped(organizationId, safeChatId);

  const activeStreamId = await getActiveChatStream(organizationId, safeChatId);

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

  await clearActiveChatStream(organizationId, safeChatId);

  return NextResponse.json({ ok: true, aborted: true });
}
