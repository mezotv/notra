import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAiChatExperimentEnabled } from "@/lib/ai-chat-experiment";
import { withOrganizationAuth } from "@/lib/auth/organization";
import {
  deleteChatSession,
  getActiveChatStream,
  getLastResponseStopped,
  isChatDeleted,
  loadChatHistory,
  renameChatSession,
  setChatSessionPinned,
} from "@/lib/chat-history";
import { updateChatSessionSchema } from "@/schemas/chat";

interface RouteContext {
  params: Promise<{ organizationId: string; chatId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { organizationId, chatId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  const aiChatEnabled = await isAiChatExperimentEnabled({
    userId: auth.context.user.id,
    email: auth.context.user.email,
    organizationId,
  });

  if (!aiChatEnabled) {
    return NextResponse.json(
      { error: "AI chat is not enabled for this organization" },
      { status: 403 }
    );
  }

  if (await isChatDeleted(organizationId, chatId)) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const [messages, lastResponseStopped, activeStreamId] = await Promise.all([
    loadChatHistory(organizationId, chatId),
    getLastResponseStopped(organizationId, chatId),
    getActiveChatStream(organizationId, chatId),
  ]);
  return NextResponse.json({
    chatId,
    messages,
    lastResponseStopped,
    activeStreamId,
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { organizationId, chatId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  const aiChatEnabled = await isAiChatExperimentEnabled({
    userId: auth.context.user.id,
    email: auth.context.user.email,
    organizationId,
  });

  if (!aiChatEnabled) {
    return NextResponse.json(
      { error: "AI chat is not enabled for this organization" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parseResult = updateChatSessionSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.issues },
      { status: 400 }
    );
  }

  const session =
    parseResult.data.title !== undefined
      ? await renameChatSession(organizationId, chatId, parseResult.data.title)
      : await setChatSessionPinned(
          organizationId,
          chatId,
          parseResult.data.pinned ?? false
        );

  if (!session) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { organizationId, chatId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  const aiChatEnabled = await isAiChatExperimentEnabled({
    userId: auth.context.user.id,
    email: auth.context.user.email,
    organizationId,
  });

  if (!aiChatEnabled) {
    return NextResponse.json(
      { error: "AI chat is not enabled for this organization" },
      { status: 403 }
    );
  }

  const deleted = await deleteChatSession(organizationId, chatId);

  if (!deleted) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
