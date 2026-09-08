import { getChatSession, loadChatHistory } from "@notra/ai/chat/history";
import { DASHBOARD_AGENT_CHANNEL_SOURCE } from "@notra/ai/constants/dashboard-agent";
import { chatIdSchema } from "@notra/ai/schemas/chat";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withOrganizationAuth } from "@/lib/auth/organization";
import type { RouteContext } from "@/types/api/routes";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<{ organizationId: string; chatId: string }>
) {
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

  const session = await getChatSession(organizationId, chatIdParse.data);
  if (session?.externalChannelId?.source !== DASHBOARD_AGENT_CHANNEL_SOURCE) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = await loadChatHistory(organizationId, chatIdParse.data);
  return NextResponse.json({ chatId: chatIdParse.data, messages });
}
