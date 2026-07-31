import { Effect } from "effect";
import type {
  SlackInboundMessageContext,
  SlackMessage,
  SlackThreadMessage,
} from "eve/channels/slack";
import type { MirrorUiMessage } from "../types/chat-mirror";
import { claimMirroredChatSession } from "./chat-mirror";
import { isPublicSlackChannel } from "./slack-public-channel";

const SLACK_MENTION_REGEX = /<@[A-Z0-9]+>/gu;
const RENDERED_MENTION_REGEX = /@U[A-Z0-9]{8,}/gu;
const WHITESPACE_REGEX = /\s+/gu;

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
): MirrorUiMessage | null {
  if (message.botId && !message.isMe) {
    return null;
  }

  const text = getSlackMessageText(message);
  if (!text) {
    return null;
  }

  return {
    id: `slack:${channelId}:${message.ts}`,
    role: message.isMe ? "assistant" : "user",
    parts: [{ type: "text", text }],
  };
}

function toSlackInboundUiMessage(
  message: SlackMessage
): MirrorUiMessage | null {
  const text = getSlackMessageText(message);
  if (!text) {
    return null;
  }

  return {
    id: `slack:${message.channelId}:${message.ts}`,
    role: "user",
    parts: [{ type: "text", text }],
  };
}

function getSlackChatTitle(message: SlackMessage) {
  const text = getSlackMessageText(message)
    .replace(SLACK_MENTION_REGEX, "")
    .replace(RENDERED_MENTION_REGEX, "")
    .replace(WHITESPACE_REGEX, " ")
    .trim();
  const preview = text.length > 52 ? `${text.slice(0, 49).trimEnd()}...` : text;
  return preview ? `Slack: ${preview}` : "Slack conversation";
}

export function mirrorPublicSlackThread(
  ctx: SlackInboundMessageContext,
  message: SlackMessage,
  organizationId: string
): Effect.Effect<string | null> {
  return Effect.gen(function* () {
    const isPublic = yield* isPublicSlackChannel(ctx, message);
    if (!isPublic) {
      return null;
    }

    return yield* claimMirroredChatSession({
      organizationId,
      source: "slack",
      externalChannelId: getSlackExternalChannelId(
        message.teamId,
        message.channelId,
        message.threadTs
      ),
      title: getSlackChatTitle(message),
      inboundMessage: toSlackInboundUiMessage(message),
      loadHistory: async () => {
        await ctx.thread.refresh();
        return ctx.thread.recentMessages.flatMap((threadMessage) => {
          const uiMessage = toSlackThreadUiMessage(
            message.channelId,
            threadMessage
          );
          return uiMessage ? [uiMessage] : [];
        });
      },
    });
  }).pipe(
    Effect.catch((error) =>
      Effect.logWarning("[agent] Slack inbound chat mirror failed", error).pipe(
        Effect.as(null)
      )
    )
  );
}
