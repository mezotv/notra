import { Effect } from "effect";
import {
  SLACK_API_BASE_URL,
  SLACK_CONVERSATION_LIST_MAX_PAGES,
  SLACK_CONVERSATION_LIST_PAGE_SIZE,
  SLACK_CONVERSATION_TYPES,
  SLACK_REQUEST_TIMEOUT_MS,
  SLACK_USER_NOT_FOUND_ERROR,
} from "../constants/slack";
import {
  SlackApiError,
  SlackConfigurationError,
  SlackInputError,
  SlackRequestError,
  SlackResponseError,
  SlackSetupError,
  slackConversationsListResponseSchema,
  slackCreateChannelResponseSchema,
  slackInviteSharedResponseSchema,
  slackLookupUserResponseSchema,
  slackOkResponseSchema,
} from "../schemas/slack";
import type {
  CreateSlackConnectChannelInput,
  CreateSlackConnectChannelInviteInput,
  CreateSlackConnectChannelInviteResult,
  EnsureSlackConnectChannelInviteResult,
  ExistingSlackConnectChannel,
  SlackConnectChannel,
  SlackConnectInviteInput,
  SlackConnectInviteResult,
  SlackInviteRecipient,
} from "../types/slack";
import { isExternalChannelName } from "../utils/slack";

const getSlackBotToken = Effect.fn("getSlackBotToken")(function* () {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  if (!token) {
    return yield* new SlackConfigurationError({
      variable: "SLACK_BOT_TOKEN",
    });
  }
  return token;
});

const getSlackFounderMemberId = Effect.fn("getSlackFounderMemberId")(
  function* () {
    const memberId = process.env.SLACK_FOUNDER_MEMBER_ID?.trim();
    if (!memberId) {
      return yield* new SlackConfigurationError({
        variable: "SLACK_FOUNDER_MEMBER_ID",
      });
    }
    return memberId;
  }
);

const resolveInviteRecipient = Effect.fn("resolveInviteRecipient")(function* (
  email: string | undefined,
  userId: string | undefined
) {
  const trimmedEmail = email?.trim();
  const trimmedUserId = userId?.trim();
  const hasEmail = Boolean(trimmedEmail);
  const hasUserId = Boolean(trimmedUserId);

  if (hasEmail === hasUserId) {
    return yield* new SlackInputError({
      message:
        "Slack Connect invites require exactly one non-empty email or userId",
    });
  }

  return (
    trimmedEmail
      ? { emails: [trimmedEmail] }
      : { user_ids: [trimmedUserId ?? ""] }
  ) satisfies SlackInviteRecipient;
});

const requestSlack = Effect.fn("requestSlack")(function* (
  method: string,
  body: unknown
) {
  const token = yield* getSlackBotToken();
  const response = yield* Effect.tryPromise({
    try: (effectSignal) =>
      fetch(`${SLACK_API_BASE_URL}/${method}`, {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        method: "POST",
        signal: AbortSignal.any([
          effectSignal,
          AbortSignal.timeout(SLACK_REQUEST_TIMEOUT_MS),
        ]),
      }),
    catch: (cause) => new SlackRequestError({ cause, operation: method }),
  });

  if (!response.ok) {
    return yield* new SlackRequestError({
      cause: new Error(
        `Slack ${method} request failed with status ${response.status}`
      ),
      operation: method,
      status: response.status,
    });
  }

  return yield* Effect.tryPromise({
    try: () => response.json(),
    catch: (cause) => new SlackResponseError({ cause, operation: method }),
  });
});

const requestSlackQuery = Effect.fn("requestSlackQuery")(function* (
  method: string,
  params: Record<string, string>
) {
  const token = yield* getSlackBotToken();
  const query = new URLSearchParams(params).toString();
  const response = yield* Effect.tryPromise({
    try: (effectSignal) =>
      fetch(`${SLACK_API_BASE_URL}/${method}?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
        signal: AbortSignal.any([
          effectSignal,
          AbortSignal.timeout(SLACK_REQUEST_TIMEOUT_MS),
        ]),
      }),
    catch: (cause) => new SlackRequestError({ cause, operation: method }),
  });

  if (!response.ok) {
    return yield* new SlackRequestError({
      cause: new Error(
        `Slack ${method} request failed with status ${response.status}`
      ),
      operation: method,
      status: response.status,
    });
  }

  return yield* Effect.tryPromise({
    try: () => response.json(),
    catch: (cause) => new SlackResponseError({ cause, operation: method }),
  });
});

const lookupSlackUserIdByEmailEffect = Effect.fn("lookupSlackUserIdByEmail")(
  function* (email: string) {
    const operation = "users.lookupByEmail";
    const response = yield* requestSlackQuery(operation, { email });
    const payload = yield* Effect.try({
      try: () => slackLookupUserResponseSchema.parse(response),
      catch: (cause) => new SlackResponseError({ cause, operation }),
    });

    if (!payload.ok) {
      if (payload.error === SLACK_USER_NOT_FOUND_ERROR) {
        return null;
      }
      return yield* new SlackApiError({
        code: payload.error ?? "unknown_error",
        operation,
      });
    }

    return payload.user?.id ?? null;
  }
);

const listExternalSlackChannelsEffect = Effect.fn("listExternalSlackChannels")(
  function* (userId?: string) {
    const operation = "users.conversations";
    const channels: SlackConnectChannel[] = [];
    let cursor = "";

    for (let page = 0; page < SLACK_CONVERSATION_LIST_MAX_PAGES; page += 1) {
      const response = yield* requestSlackQuery(operation, {
        exclude_archived: "true",
        limit: String(SLACK_CONVERSATION_LIST_PAGE_SIZE),
        types: SLACK_CONVERSATION_TYPES,
        ...(userId ? { user: userId } : {}),
        ...(cursor ? { cursor } : {}),
      });
      const payload = yield* Effect.try({
        try: () => slackConversationsListResponseSchema.parse(response),
        catch: (cause) => new SlackResponseError({ cause, operation }),
      });

      if (!payload.ok) {
        return yield* new SlackApiError({
          code: payload.error ?? "unknown_error",
          operation,
        });
      }

      for (const channel of payload.channels ?? []) {
        if (!channel.is_archived && isExternalChannelName(channel.name)) {
          channels.push({ channelId: channel.id, channelName: channel.name });
        }
      }

      cursor = payload.response_metadata?.next_cursor ?? "";
      if (!cursor) {
        break;
      }
    }

    return channels;
  }
);

const findExistingSlackConnectChannelEffect = Effect.fn(
  "findExistingSlackConnectChannel"
)(function* (channelName: string, email: string | undefined) {
  if (email) {
    const userId = yield* lookupSlackUserIdByEmailEffect(email);
    if (userId) {
      const memberChannels = yield* listExternalSlackChannelsEffect(userId);
      const memberChannel = memberChannels.at(0);
      if (memberChannel) {
        return {
          ...memberChannel,
          matchedBy: "member-email",
        } satisfies ExistingSlackConnectChannel;
      }
    }
  }

  const botChannels = yield* listExternalSlackChannelsEffect();
  const namedChannel = botChannels.find(
    (channel) => channel.channelName === channelName
  );
  if (namedChannel) {
    return {
      ...namedChannel,
      matchedBy: "channel-name",
    } satisfies ExistingSlackConnectChannel;
  }

  return null;
});

export function hasSlackConnectConfigured(): boolean {
  return Boolean(
    process.env.SLACK_BOT_TOKEN?.trim() &&
      process.env.SLACK_FOUNDER_MEMBER_ID?.trim()
  );
}

const inviteToSlackConnectEffect = Effect.fn("inviteToSlackConnect")(function* (
  input: SlackConnectInviteInput
) {
  const { channelId, email, userId, externalLimited } = input;
  const recipient = yield* resolveInviteRecipient(email, userId);

  const operation = "conversations.inviteShared";
  const response = yield* requestSlack(operation, {
    channel: channelId,
    ...recipient,
    ...(externalLimited === undefined
      ? {}
      : { external_limited: externalLimited }),
  });
  const payload = yield* Effect.try({
    try: () => slackInviteSharedResponseSchema.parse(response),
    catch: (cause) => new SlackResponseError({ cause, operation }),
  });

  if (!payload.ok) {
    return yield* new SlackApiError({
      code: payload.error ?? "unknown_error",
      operation,
    });
  }

  if (!payload.invite_id) {
    return yield* new SlackResponseError({
      cause: new Error(
        "Slack Connect invite succeeded but returned no invite_id"
      ),
      operation,
    });
  }

  return {
    inviteId: payload.invite_id,
    isLegacySharedChannel: payload.is_legacy_shared_channel ?? false,
  } satisfies SlackConnectInviteResult;
});

export function inviteToSlackConnect(input: SlackConnectInviteInput) {
  return Effect.runPromise(inviteToSlackConnectEffect(input));
}

const createSlackConnectChannelEffect = Effect.fn("createSlackConnectChannel")(
  function* (input: CreateSlackConnectChannelInput) {
    const operation = "conversations.create";
    const response = yield* requestSlack(operation, {
      name: input.channelName,
      is_private: input.isPrivate ?? true,
    });
    const payload = yield* Effect.try({
      try: () => slackCreateChannelResponseSchema.parse(response),
      catch: (cause) => new SlackResponseError({ cause, operation }),
    });

    if (!payload.ok) {
      return yield* new SlackApiError({
        code: payload.error ?? "unknown_error",
        operation,
      });
    }

    if (!payload.channel) {
      return yield* new SlackResponseError({
        cause: new Error("Slack channel creation returned no channel"),
        operation,
      });
    }

    return {
      channelId: payload.channel.id,
      channelName: payload.channel.name,
    } satisfies SlackConnectChannel;
  }
);

export function createSlackConnectChannel(
  input: CreateSlackConnectChannelInput
) {
  return Effect.runPromise(createSlackConnectChannelEffect(input));
}

const inviteSlackMemberToChannelEffect = Effect.fn(
  "inviteSlackMemberToChannel"
)(function* (channelId: string, memberId: string) {
  const operation = "conversations.invite";
  const response = yield* requestSlack(operation, {
    channel: channelId,
    users: memberId,
  });
  const payload = yield* Effect.try({
    try: () => slackOkResponseSchema.parse(response),
    catch: (cause) => new SlackResponseError({ cause, operation }),
  });

  if (!payload.ok && payload.error !== "already_in_channel") {
    return yield* new SlackApiError({
      code: payload.error ?? "unknown_error",
      operation,
    });
  }
});

const archiveSlackChannelEffect = Effect.fn("archiveSlackChannel")(function* (
  channelId: string
) {
  const operation = "conversations.archive";
  const response = yield* requestSlack(operation, { channel: channelId });
  const payload = yield* Effect.try({
    try: () => slackOkResponseSchema.parse(response),
    catch: (cause) => new SlackResponseError({ cause, operation }),
  });

  if (!payload.ok) {
    return yield* new SlackApiError({
      code: payload.error ?? "unknown_error",
      operation,
    });
  }
});

export function archiveSlackChannel(channelId: string): Promise<void> {
  return Effect.runPromise(archiveSlackChannelEffect(channelId));
}

const createSlackConnectChannelWithInviteEffect = Effect.fn(
  "createSlackConnectChannelWithInvite"
)(function* (input: CreateSlackConnectChannelInviteInput) {
  yield* resolveInviteRecipient(input.email, input.userId);
  const founderMemberId = yield* getSlackFounderMemberId();

  const channel = yield* createSlackConnectChannelEffect({
    channelName: input.channelName,
    isPrivate: input.isPrivate,
  });

  const inviteEffect = Effect.gen(function* () {
    yield* inviteSlackMemberToChannelEffect(channel.channelId, founderMemberId);
    return yield* inviteToSlackConnectEffect({
      channelId: channel.channelId,
      email: input.email,
      userId: input.userId,
      externalLimited: input.externalLimited,
    });
  });

  return yield* Effect.matchEffect(inviteEffect, {
    onFailure: (cause) =>
      archiveSlackChannelEffect(channel.channelId).pipe(
        Effect.matchEffect({
          onFailure: (archiveCause) =>
            Effect.fail(
              new SlackSetupError({
                archiveCause,
                archived: false,
                cause,
                channelName: channel.channelName,
              })
            ),
          onSuccess: () =>
            Effect.fail(
              new SlackSetupError({
                archived: true,
                cause,
                channelName: channel.channelName,
              })
            ),
        })
      ),
    onSuccess: (invite) =>
      Effect.succeed({
        ...channel,
        ...invite,
      } satisfies CreateSlackConnectChannelInviteResult),
  });
});

export function createSlackConnectChannelWithInvite(
  input: CreateSlackConnectChannelInviteInput
): Promise<CreateSlackConnectChannelInviteResult> {
  return Effect.runPromise(createSlackConnectChannelWithInviteEffect(input));
}

const ensureSlackConnectChannelWithInviteEffect = Effect.fn(
  "ensureSlackConnectChannelWithInvite"
)(function* (input: CreateSlackConnectChannelInviteInput) {
  yield* resolveInviteRecipient(input.email, input.userId);

  const existing = yield* findExistingSlackConnectChannelEffect(
    input.channelName,
    input.email?.trim().toLowerCase()
  ).pipe(
    Effect.catch((error) =>
      Effect.logWarning("Slack dedup check failed", error).pipe(Effect.as(null))
    )
  );

  if (existing?.matchedBy === "member-email") {
    return {
      alreadyMember: true,
      channelId: existing.channelId,
      channelName: existing.channelName,
      deduplicated: true,
    } satisfies EnsureSlackConnectChannelInviteResult;
  }

  if (existing) {
    const founderMemberId = yield* getSlackFounderMemberId();
    yield* inviteSlackMemberToChannelEffect(
      existing.channelId,
      founderMemberId
    );
    const invite = yield* inviteToSlackConnectEffect({
      channelId: existing.channelId,
      email: input.email,
      userId: input.userId,
      externalLimited: input.externalLimited,
    });
    return {
      alreadyMember: false,
      channelId: existing.channelId,
      channelName: existing.channelName,
      deduplicated: true,
      inviteId: invite.inviteId,
      isLegacySharedChannel: invite.isLegacySharedChannel,
    } satisfies EnsureSlackConnectChannelInviteResult;
  }

  const created = yield* createSlackConnectChannelWithInviteEffect(input);
  return {
    alreadyMember: false,
    channelId: created.channelId,
    channelName: created.channelName,
    deduplicated: false,
    inviteId: created.inviteId,
    isLegacySharedChannel: created.isLegacySharedChannel,
  } satisfies EnsureSlackConnectChannelInviteResult;
});

export function ensureSlackConnectChannelWithInvite(
  input: CreateSlackConnectChannelInviteInput
): Promise<EnsureSlackConnectChannelInviteResult> {
  return Effect.runPromise(ensureSlackConnectChannelWithInviteEffect(input));
}
