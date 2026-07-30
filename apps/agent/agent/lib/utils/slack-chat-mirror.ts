import {
  appendChatMessageIfMissing,
  claimChatSessionForExternalChannel,
  generateChatId,
  renameChatSession,
} from "@notra/ai/chat/history";
import { getSessionAttribute } from "@notra/tools/utils/session";
import { Effect } from "effect";
import type {
  SlackInboundMessageContext,
  SlackMessage,
  SlackThreadMessage,
} from "eve/channels/slack";
import type { HookContext } from "eve/hooks";
import { SlackChatMirrorError } from "../schemas/slack";
import { isPublicSlackChannel } from "./slack-public-channel";

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
    .replace(/@U[A-Z0-9]{8,}/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  const preview = text.length > 52 ? `${text.slice(0, 49).trimEnd()}...` : text;
  return preview ? `Slack: ${preview}` : "Slack conversation";
}

function mirrorStep<T>(
  operation: string,
  run: () => Promise<T>
): Effect.Effect<T, SlackChatMirrorError> {
  return Effect.tryPromise({
    try: run,
    catch: (cause) => new SlackChatMirrorError({ cause, operation }),
  });
}

function mirrorSlackInboundMessage(
  ctx: SlackInboundMessageContext,
  message: SlackMessage,
  organizationId: string
): Effect.Effect<string, SlackChatMirrorError> {
  return Effect.gen(function* () {
    const externalChannelId = getSlackExternalChannelId(
      message.teamId,
      message.channelId,
      message.threadTs
    );
    const claim = yield* mirrorStep("claim-chat-session", () =>
      claimChatSessionForExternalChannel(
        organizationId,
        "slack",
        externalChannelId,
        generateChatId()
      )
    );
    const inboundMessage = toSlackInboundUiMessage(message);

    if (!claim.created) {
      if (inboundMessage) {
        yield* mirrorStep("append-inbound-message", () =>
          appendChatMessageIfMissing(
            organizationId,
            claim.chatId,
            inboundMessage
          )
        );
      }
      return claim.chatId;
    }

    yield* mirrorStep("refresh-thread", () => ctx.thread.refresh());
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

    for (const mirroredMessage of mirroredMessages) {
      yield* mirrorStep("append-thread-message", () =>
        appendChatMessageIfMissing(
          organizationId,
          claim.chatId,
          mirroredMessage
        )
      );
    }
    yield* mirrorStep("rename-chat-session", () =>
      renameChatSession(
        organizationId,
        claim.chatId,
        getSlackChatTitle(message)
      )
    );

    return claim.chatId;
  });
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
    return yield* mirrorSlackInboundMessage(ctx, message, organizationId);
  }).pipe(
    Effect.catch((error) =>
      Effect.logWarning("[agent] Slack inbound chat mirror failed", error).pipe(
        Effect.as(null)
      )
    )
  );
}

export async function resolveSlackMirrorChatId(ctx: HookContext) {
  if (ctx.channel.kind !== "channel:slack") {
    return null;
  }

  return getSessionAttribute(ctx, "chatId");
}
