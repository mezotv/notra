import {
  SLACK_API_BASE_URL,
  SLACK_REQUEST_TIMEOUT_MS,
} from "../constants/slack";
import {
  slackCreateChannelResponseSchema,
  slackInviteSharedResponseSchema,
  slackOkResponseSchema,
} from "../schemas/slack";
import type {
  CreateSlackConnectChannelInput,
  CreateSlackConnectChannelInviteInput,
  CreateSlackConnectChannelInviteResult,
  SlackConnectChannel,
  SlackConnectInviteInput,
  SlackConnectInviteResult,
  SlackInviteRecipient,
} from "../types/slack";

function getSlackBotToken(): string {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not configured");
  }
  return token;
}

function resolveInviteRecipient(
  email: string | undefined,
  userId: string | undefined
): SlackInviteRecipient {
  const trimmedEmail = email?.trim();
  const trimmedUserId = userId?.trim();
  const hasEmail = Boolean(trimmedEmail);
  const hasUserId = Boolean(trimmedUserId);

  if (hasEmail === hasUserId) {
    throw new Error(
      "Slack Connect invites require exactly one non-empty email or userId"
    );
  }

  return trimmedEmail
    ? { emails: [trimmedEmail] }
    : { user_ids: [trimmedUserId ?? ""] };
}

async function requestSlack(method: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${SLACK_API_BASE_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSlackBotToken()}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(SLACK_REQUEST_TIMEOUT_MS),
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
  const recipient = resolveInviteRecipient(email, userId);

  const payload = slackInviteSharedResponseSchema.parse(
    await requestSlack("conversations.inviteShared", {
      channel: channelId,
      ...recipient,
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
      name: input.channelName,
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

export async function archiveSlackChannel(channelId: string): Promise<void> {
  const payload = slackOkResponseSchema.parse(
    await requestSlack("conversations.archive", { channel: channelId })
  );

  if (!payload.ok) {
    throw new Error(
      `Slack channel archive was rejected: ${payload.error ?? "unknown_error"}`
    );
  }
}

export async function createSlackConnectChannelWithInvite(
  input: CreateSlackConnectChannelInviteInput
): Promise<CreateSlackConnectChannelInviteResult> {
  resolveInviteRecipient(input.email, input.userId);

  const channel = await createSlackConnectChannel({
    channelName: input.channelName,
    isPrivate: input.isPrivate,
  });

  try {
    const invite = await inviteToSlackConnect({
      channelId: channel.channelId,
      email: input.email,
      userId: input.userId,
      externalLimited: input.externalLimited,
    });

    return { ...channel, ...invite };
  } catch (error) {
    const archived = await archiveSlackChannel(channel.channelId)
      .then(() => true)
      .catch(() => false);

    throw new Error(
      `Slack Connect invite failed after creating #${channel.channelName}; the channel was ${archived ? "archived" : "left in place and could not be archived"}`,
      { cause: error }
    );
  }
}
