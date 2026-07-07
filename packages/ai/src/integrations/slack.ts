import { SLACK_API_BASE_URL } from "../constants/slack";
import {
  slackCreateChannelResponseSchema,
  slackInviteSharedResponseSchema,
} from "../schemas/slack";
import type {
  CreateSlackConnectChannelInput,
  CreateSlackConnectChannelInviteInput,
  CreateSlackConnectChannelInviteResult,
  SlackConnectChannel,
  SlackConnectInviteInput,
  SlackConnectInviteResult,
} from "../types/slack";

function getSlackBotToken(): string {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not configured");
  }
  return token;
}

async function requestSlack(method: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${SLACK_API_BASE_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSlackBotToken()}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Slack ${method} request failed with status ${response.status}`
    );
  }

  return response.json();
}

export function hasSlackConnectConfigured(): boolean {
  return Boolean(process.env.SLACK_BOT_TOKEN?.trim());
}

export async function inviteToSlackConnect(
  input: SlackConnectInviteInput
): Promise<SlackConnectInviteResult> {
  const { channelId, email, userId, externalLimited } = input;
  const hasEmail = email !== undefined;
  const hasUserId = userId !== undefined;

  if (hasEmail === hasUserId) {
    throw new Error(
      "Slack Connect invites require exactly one of email or userId"
    );
  }

  const payload = slackInviteSharedResponseSchema.parse(
    await requestSlack("conversations.inviteShared", {
      channel: channelId,
      ...(hasEmail ? { emails: [email] } : { user_ids: [userId] }),
      ...(externalLimited !== undefined
        ? { external_limited: externalLimited }
        : {}),
    })
  );

  if (!payload.ok) {
    throw new Error(
      `Slack Connect invite was rejected: ${payload.error ?? "unknown_error"}`
    );
  }

  if (!payload.invite_id) {
    throw new Error("Slack Connect invite succeeded but returned no invite_id");
  }

  return {
    inviteId: payload.invite_id,
    isLegacySharedChannel: payload.is_legacy_shared_channel ?? false,
  };
}

export async function createSlackConnectChannel(
  input: CreateSlackConnectChannelInput
): Promise<SlackConnectChannel> {
  const payload = slackCreateChannelResponseSchema.parse(
    await requestSlack("conversations.create", {
      name: input.name,
      is_private: input.isPrivate ?? true,
    })
  );

  if (!payload.ok) {
    throw new Error(
      `Slack channel creation was rejected: ${payload.error ?? "unknown_error"}`
    );
  }

  if (!payload.channel) {
    throw new Error("Slack channel creation returned no channel");
  }

  return {
    channelId: payload.channel.id,
    channelName: payload.channel.name,
  };
}

export async function createSlackConnectChannelWithInvite(
  input: CreateSlackConnectChannelInviteInput
): Promise<CreateSlackConnectChannelInviteResult> {
  const channel = await createSlackConnectChannel({
    name: input.channelName,
    isPrivate: input.isPrivate,
  });

  const invite = await inviteToSlackConnect({
    channelId: channel.channelId,
    email: input.email,
    userId: input.userId,
    externalLimited: input.externalLimited,
  });

  return { ...channel, ...invite };
}
