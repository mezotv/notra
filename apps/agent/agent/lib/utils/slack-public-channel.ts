import { Effect } from "effect";
import type {
  SlackInboundMessageContext,
  SlackMessage,
} from "eve/channels/slack";
import { SlackApiError } from "../schemas/slack";

function isPublicChannelInfo(channel: unknown): boolean {
  return (
    typeof channel === "object" &&
    channel !== null &&
    "is_channel" in channel &&
    channel.is_channel === true &&
    ("is_private" in channel ? channel.is_private !== true : true)
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

  return Effect.tryPromise({
    try: () =>
      ctx.slack.request("conversations.info", { channel: message.channelId }),
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
