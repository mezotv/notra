import type { UIMessage } from "ai";
import { realtime } from "../realtime";

export function getChatMirrorChannelName(
  organizationId: string,
  chatId: string
) {
  return `chat-mirror:${organizationId}:${chatId}`;
}

export async function publishChatMirrorMessage(
  organizationId: string,
  chatId: string,
  message: UIMessage
): Promise<void> {
  if (!realtime) {
    return;
  }
  const channel = realtime.channel(
    getChatMirrorChannelName(organizationId, chatId)
  );
  await channel.emit("mirror.message", message);
}
