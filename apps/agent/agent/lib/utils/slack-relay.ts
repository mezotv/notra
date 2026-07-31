import { SLACK_RELAY_EVENT_TYPE } from "@notra/ai/constants/chat";
import { slackRelayMetadataSchema } from "@notra/ai/schemas/chat";
import type { SlackEvent, SlackEventEnvelope } from "eve/channels/slack";
import type { SlackDashboardRelay } from "../types/slack";
import {
  isChannelAllowed,
  resolveSlackInstallation,
} from "./slack-installation";

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

export async function parseSlackDashboardRelay(
  envelope: SlackEventEnvelope,
  event: SlackEvent
): Promise<SlackDashboardRelay | null> {
  if (event.type !== "message") {
    return null;
  }

  const payloadInput = getRelayEventPayload(event);
  if (!payloadInput) {
    return null;
  }

  const authoredByThisApp =
    typeof event.app_id === "string" &&
    typeof envelope.api_app_id === "string" &&
    event.app_id === envelope.api_app_id;
  if (!authoredByThisApp) {
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

  const teamId = envelope.team_id;
  if (!teamId) {
    return null;
  }
  const installation = await resolveSlackInstallation(teamId);
  if (
    !installation ||
    payload.data.organization_id !== installation.organizationId ||
    !isChannelAllowed(installation, channelId)
  ) {
    return null;
  }
  const organizationId = installation.organizationId;

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
