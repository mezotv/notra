import {
  defaultSlackAuth,
  type SlackContext,
  type SlackMessage,
} from "eve/channels/slack";

function isAllowedSlackChannel(channelId: string): boolean {
  const configuredChannelIds =
    process.env.SLACK_AGENT_ALLOWED_CHANNEL_IDS?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  return (
    configuredChannelIds.length === 0 ||
    configuredChannelIds.includes(channelId)
  );
}

export function createNotraSlackAuth(ctx: SlackContext, message: SlackMessage) {
  const organizationId = process.env.SLACK_AGENT_ORGANIZATION_ID?.trim();
  const teamId = process.env.SLACK_AGENT_TEAM_ID?.trim();

  if (
    !organizationId ||
    !teamId ||
    message.teamId !== teamId ||
    !isAllowedSlackChannel(message.channelId)
  ) {
    return null;
  }

  const auth = defaultSlackAuth(message, ctx);
  if (!auth) {
    return null;
  }

  return {
    ...auth,
    attributes: {
      ...auth.attributes,
      organizationId,
      surface: "standalone-chat",
    },
  };
}
