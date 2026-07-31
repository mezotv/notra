import {
  chatMessageMetadataSchema,
  uiMessageSchema,
} from "@notra/ai/schemas/chat";
import type { ChatUIMessage } from "@notra/ai/types/chat";

export async function relaySlackMirrorMessage(
  organizationId: string,
  chatId: string,
  text: string
): Promise<ChatUIMessage | null> {
  const res = await fetch(
    `/api/organizations/${organizationId}/chat/${encodeURIComponent(chatId)}/relay`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    }
  );
  if (!res.ok) {
    throw new Error("Failed to send message to Slack");
  }
  const data = await res.json();
  const parsed = uiMessageSchema.safeParse(data?.message);
  if (!parsed.success) {
    return null;
  }
  const metadata = chatMessageMetadataSchema.safeParse(parsed.data.metadata);
  return {
    ...parsed.data,
    metadata: metadata.success ? metadata.data : undefined,
  };
}

export async function relaySlackApproval(
  organizationId: string,
  chatId: string,
  requestId: string,
  approved: boolean
): Promise<void> {
  const res = await fetch(
    `/api/organizations/${organizationId}/chat/${encodeURIComponent(chatId)}/relay-approval`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId, approved }),
    }
  );
  if (!res.ok) {
    throw new Error("Failed to send the approval to Slack");
  }
}
