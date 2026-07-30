import { SLACK_RELAY_EVENT_TYPE } from "@notra/ai/constants/chat";
import { slackRelayMetadataSchema } from "@notra/ai/schemas/chat";
import type { SlackEvent, SlackEventEnvelope } from "eve/channels/slack";
import type { SlackDashboardRelay } from "../types/slack";
import { isAllowedSlackChannel } from "./slack-auth";

function getRelayEventPayload(event: SlackEvent): unknown {
  const metadata = event.metadata;
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    !("event_type" in metadata) ||
    metadata.event_type !== SLACK_RELAY_EVENT_TYPE ||
    !("event_payload" in metadata)
  ) {
    return null;
  }
  return metadata.event_payload;
}

export function parseSlackDashboardRelay(
  envelope: SlackEventEnvelope,
  event: SlackEvent
): SlackDashboardRelay | null {
  if (event.type !== "message") {
    return null;
  }

  const payloadInput = getRelayEventPayload(event);
  if (!payloadInput) {
    return null;
  }

  const payload = slackRelayMetadataSchema.safeParse(payloadInput);
  const channelId = typeof event.channel === "string" ? event.channel : null;
  const ts = typeof event.ts === "string" ? event.ts : null;
  const threadTs =
    typeof event.thread_ts === "string" && event.thread_ts.length > 0
      ? event.thread_ts
      : ts;
  if (!(payload.success && channelId && threadTs)) {
    return null;
  }

  const teamId = process.env.SLACK_AGENT_TEAM_ID?.trim();
  const organizationId = process.env.SLACK_AGENT_ORGANIZATION_ID?.trim();
  if (
    !teamId ||
    !organizationId ||
    envelope.team_id !== teamId ||
    payload.data.organization_id !== organizationId ||
    !isAllowedSlackChannel(channelId)
  ) {
    return null;
  }

  return {
    channelId,
    threadTs,
    message: `${payload.data.user_name} (from the Notra dashboard): ${payload.data.text}`,
    auth: {
      attributes: {
        author_type: "user",
        channel_id: channelId,
        thread_ts: threadTs,
        team_id: teamId,
        user_name: payload.data.user_name,
        organizationId,
        surface: "standalone-chat",
        chatId: payload.data.chat_id,
      },
      authenticator: "notra-dashboard-relay",
      issuer: `slack:${teamId}`,
      principalId: `dashboard:${organizationId}:${payload.data.user_name}`,
      principalType: "user",
    },
  };
}
