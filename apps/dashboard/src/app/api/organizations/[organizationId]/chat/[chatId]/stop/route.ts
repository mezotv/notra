import {
  clearActiveChatStream,
  getActiveChatStream,
  getChatStreamChannelName,
  setChatAbortFlag,
  setLastResponseStopped,
} from "@notra/ai/chat/history";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { realtime } from "@/lib/realtime";

interface RouteContext {
  params: Promise<{ organizationId: string; chatId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { organizationId, chatId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  await setLastResponseStopped(organizationId, chatId);

  const activeStreamId = await getActiveChatStream(organizationId, chatId);

  if (!activeStreamId) {
    return NextResponse.json({ ok: true, aborted: false });
  }

  await setChatAbortFlag(organizationId, chatId, activeStreamId);

  if (realtime) {
    const channel = realtime.channel(
      getChatStreamChannelName(organizationId, chatId, activeStreamId)
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
        chatId,
        streamId: activeStreamId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await clearActiveChatStream(organizationId, chatId);

  return NextResponse.json({ ok: true, aborted: true });
}
