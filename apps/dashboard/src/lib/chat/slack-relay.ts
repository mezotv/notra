import { uiMessageSchema } from "@notra/ai/schemas/chat";
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
  return data.message;
}
