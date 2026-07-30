import { SLACK_RELAY_EVENT_TYPE } from "@notra/ai/constants/chat";
import {
  slackExternalChannelKeySchema,
  slackPostMessageResponseSchema,
} from "@/schemas/slack-relay";
import type { SlackRelayTarget } from "@/types/slack-relay";

export function parseSlackExternalChannelKey(
  key: string
): SlackRelayTarget | null {
  const parsed = slackExternalChannelKeySchema.safeParse(key);
  if (!parsed.success) {
    return null;
  }
  const [teamId, channelId, threadTs] = parsed.data.split(":");
  if (!(teamId && channelId && threadTs)) {
    return null;
  }
  return { teamId, channelId, threadTs };
}

export async function postSlackRelayMessage(input: {
  target: SlackRelayTarget;
  text: string;
  userName: string;
  chatId: string;
  organizationId: string;
}): Promise<{ ts: string }> {
  const token = process.env.SLACK_AGENT_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("SLACK_AGENT_BOT_TOKEN is required for Slack relay");
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel: input.target.channelId,
      thread_ts: input.target.threadTs,
      text: `*${input.userName}:* ${input.text}`,
      metadata: {
        event_type: SLACK_RELAY_EVENT_TYPE,
        event_payload: {
          chat_id: input.chatId,
          organization_id: input.organizationId,
          user_name: input.userName,
          text: input.text,
        },
      },
    }),
  });

  const parsed = slackPostMessageResponseSchema.safeParse(
    await response.json()
  );
  if (!(parsed.success && parsed.data.ok && parsed.data.ts)) {
    throw new Error(
      `Slack relay post failed: ${parsed.success ? (parsed.data.error ?? "unknown_error") : "invalid_response"}`
    );
  }

  return { ts: parsed.data.ts };
}
