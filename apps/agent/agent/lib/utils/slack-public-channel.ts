import { Effect } from "effect";
import type {
  SlackInboundMessageContext,
  SlackMessage,
} from "eve/channels/slack";
import { CHANNEL_VISIBILITY_TTL_MS } from "../constants/slack";
import { SlackApiError } from "../schemas/slack";
import type { ChannelVisibilityCacheEntry } from "../types/slack";

const channelVisibilityCache = new Map<string, ChannelVisibilityCacheEntry>();

function isPublicChannelInfo(channel: unknown): boolean {
  return (
    typeof channel === "object" &&
    channel !== null &&
    "is_channel" in channel &&
    channel.is_channel === true &&
    ("is_private" in channel ? channel.is_private !== true : true)
  );
}

function fetchChannelVisibility(
  ctx: SlackInboundMessageContext,
  channelId: string
): Effect.Effect<boolean, SlackApiError> {
  return Effect.tryPromise({
    try: () => ctx.slack.request("conversations.info", { channel: channelId }),
    catch: (cause) =>
      new SlackApiError({ cause, operation: "conversations.info" }),
  }).pipe(
    Effect.flatMap((response) =>
      response.ok
        ? Effect.succeed(isPublicChannelInfo(response.channel))
        : Effect.fail(
            new SlackApiError({
              cause: response.error ?? "unknown_error",
              operation: "conversations.info",
            })
          )
    )
  );
}

export function isPublicSlackChannel(
  ctx: SlackInboundMessageContext,
  message: SlackMessage
): Effect.Effect<boolean, SlackApiError> {
  const channelType = message.raw.channel_type;
  if (typeof channelType === "string") {
    return Effect.succeed(channelType === "channel");
  }

  const cached = channelVisibilityCache.get(message.channelId);
  if (cached && cached.expiresAt > Date.now()) {
    return Effect.succeed(cached.isPublic);
  }

  return fetchChannelVisibility(ctx, message.channelId).pipe(
    Effect.tap((isPublic) =>
      Effect.sync(() => {
        channelVisibilityCache.set(message.channelId, {
          expiresAt: Date.now() + CHANNEL_VISIBILITY_TTL_MS,
          isPublic,
        });
      })
    )
  );
}
