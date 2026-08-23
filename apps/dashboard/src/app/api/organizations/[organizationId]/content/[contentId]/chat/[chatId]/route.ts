import { loadContentChatHistory } from "@notra/ai/chat/history";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import type { RouteContext } from "@/types/api/routes";

export async function GET(
  request: NextRequest,
  {
    params,
  }: RouteContext<{
    organizationId: string;
    contentId: string;
    chatId: string;
  }>
) {
  const { organizationId, contentId, chatId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  const messages = await loadContentChatHistory(
    organizationId,
    contentId,
    chatId
  );
  if (!messages) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  return NextResponse.json({ chatId, messages });
}
