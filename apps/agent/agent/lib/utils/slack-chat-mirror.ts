import {
  appendChatMessageIfMissing,
  claimChatSessionForExternalChannel,
  generateChatId,
  renameChatSession,
  replaceChatHistory,
} from "@notra/ai/chat/history";
import { getSessionAttribute } from "@notra/tools/utils/session";
import type {
  SlackInboundMessageContext,
  SlackMessage,
  SlackThreadMessage,
} from "eve/channels/slack";
import type { HookContext } from "eve/hooks";

function getSlackExternalChannelId(
  teamId: string | undefined,
  channelId: string,
  threadTs: string
) {
  return `${teamId ?? "workspace"}:${channelId}:${threadTs}`;
}

function getSlackMessageText(message: {
  readonly markdown: string;
  readonly text: string;
}) {
  return message.markdown.trim() || message.text.trim();
}

function toSlackThreadUiMessage(
  channelId: string,
  message: SlackThreadMessage
) {
  if (message.botId && !message.isMe) {
    return null;
  }

  const text = getSlackMessageText(message);
  if (!text) {
    return null;
  }

  return {
    id: `slack:${channelId}:${message.ts}`,
    role: message.isMe ? ("assistant" as const) : ("user" as const),
    parts: [{ type: "text" as const, text }],
  };
}

function toSlackInboundUiMessage(message: SlackMessage) {
  const text = getSlackMessageText(message);
  if (!text) {
    return null;
  }

  return {
    id: `slack:${message.channelId}:${message.ts}`,
    role: "user" as const,
    parts: [{ type: "text" as const, text }],
  };
}

function getSlackChatTitle(message: SlackMessage) {
  const text = getSlackMessageText(message)
    .replace(/<@[A-Z0-9]+>/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  const preview = text.length > 52 ? `${text.slice(0, 49).trimEnd()}...` : text;
  return preview ? `Slack: ${preview}` : "Slack conversation";
}

export async function mirrorSlackInboundMessage(
  ctx: SlackInboundMessageContext,
  message: SlackMessage,
  organizationId: string
) {
  const externalChannelId = getSlackExternalChannelId(
    message.teamId,
    message.channelId,
    message.threadTs
  );
  const claim = await claimChatSessionForExternalChannel(
    organizationId,
    "slack",
    externalChannelId,
    generateChatId()
  );
  const inboundMessage = toSlackInboundUiMessage(message);

  if (!claim.created) {
    if (inboundMessage) {
      await appendChatMessageIfMissing(
        organizationId,
        claim.chatId,
        inboundMessage
      );
    }
    return claim.chatId;
  }

  await ctx.thread.refresh();
  const mirroredMessages = ctx.thread.recentMessages.flatMap(
    (threadMessage) => {
      const uiMessage = toSlackThreadUiMessage(
        message.channelId,
        threadMessage
      );
      return uiMessage ? [uiMessage] : [];
    }
  );
  if (
    inboundMessage &&
    !mirroredMessages.some((item) => item.id === inboundMessage.id)
  ) {
    mirroredMessages.push(inboundMessage);
  }

  await Promise.all([
    replaceChatHistory(organizationId, claim.chatId, mirroredMessages, {
      source: "slack",
      id: externalChannelId,
    }),
    renameChatSession(organizationId, claim.chatId, getSlackChatTitle(message)),
  ]);

  return claim.chatId;
}

export async function resolveSlackMirrorChatId(ctx: HookContext) {
  if (ctx.channel.kind !== "slack") {
    return null;
  }

  return getSessionAttribute(ctx, "chatId");
}
