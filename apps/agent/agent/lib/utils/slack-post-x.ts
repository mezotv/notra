import { redis } from "@notra/ai/utils/redis";
import type { LinkedTwitterAccount } from "@notra/tools/types/social";
import { publishTwitterPost } from "@notra/tools/utils/social-publish";
import { Effect } from "effect";
import type {
  SlackInteractionContext,
  SlackPostInput,
} from "eve/channels/slack";

import {
  POST_TO_X_ACCOUNT_ACTION_PREFIX,
  POST_TO_X_CANCEL_ACTION_PREFIX,
  POST_TO_X_PENDING_TTL_SECONDS,
} from "../constants/slack-post-x";
import type { PendingPostToX, PostToXOutcome } from "../types/slack";

function pendingKey(callId: string) {
  return `slack:post-x:${callId}`;
}

export async function savePendingPostToX(
  callId: string,
  pending: PendingPostToX
): Promise<boolean> {
  if (!redis) {
    return false;
  }
  await redis.set(pendingKey(callId), JSON.stringify(pending), {
    ex: POST_TO_X_PENDING_TTL_SECONDS,
  });
  return true;
}

export async function readPendingPostToX(
  callId: string
): Promise<PendingPostToX | null> {
  if (!redis) {
    return null;
  }
  const raw = await redis.get<PendingPostToX>(pendingKey(callId));
  if (!raw) {
    return null;
  }
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export function buildPostToXConfirmCard(input: {
  requestId: string;
  callId: string;
  username: string;
  accounts: readonly LinkedTwitterAccount[];
}): SlackPostInput {
  const plainText = (value: string) => ({
    type: "plain_text" as const,
    text: value,
    emoji: true,
  });

  const accountOption = (account: LinkedTwitterAccount) => ({
    text: plainText(`@${account.username}`),
    value: JSON.stringify({
      callId: input.callId,
      accountId: account.id,
      username: account.username,
    }),
  });

  const defaultAccount =
    input.accounts.find((account) => account.username === input.username) ??
    input.accounts.at(0);

  const accountSelector =
    input.accounts.length > 1 && defaultAccount
      ? [
          {
            type: "section",
            text: { type: "mrkdwn", text: "Post as" },
            accessory: {
              type: "static_select",
              action_id: `${POST_TO_X_ACCOUNT_ACTION_PREFIX}:${input.callId}`,
              initial_option: accountOption(defaultAccount),
              options: input.accounts.slice(0, 25).map(accountOption),
            },
          },
        ]
      : [];

  const promptText =
    input.accounts.length > 1
      ? "Post this tweet to X? It publishes immediately to the selected account."
      : `Post this tweet to X as *@${input.username}*? It publishes immediately.`;

  return {
    text: `Post this tweet to X as @${input.username}?`,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: promptText },
      },
      ...accountSelector,
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: `eve_input:${input.requestId}:button:7`,
            text: plainText("Yes, post to X"),
            style: "danger",
            value: "post_to_x",
          },
          {
            type: "button",
            action_id: `${POST_TO_X_CANCEL_ACTION_PREFIX}:${input.requestId}`,
            text: plainText("Cancel"),
            value: input.requestId,
          },
        ],
      },
    ],
  };
}

export async function switchPendingPostToXAccount(
  selectedValue: string | undefined
): Promise<void> {
  if (!selectedValue) {
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(selectedValue);
  } catch {
    return;
  }
  if (
    !(
      typeof parsed === "object" &&
      parsed !== null &&
      "callId" in parsed &&
      typeof parsed.callId === "string" &&
      "accountId" in parsed &&
      typeof parsed.accountId === "string" &&
      "username" in parsed &&
      typeof parsed.username === "string"
    )
  ) {
    return;
  }

  const pending = await readPendingPostToX(parsed.callId);
  if (!pending) {
    return;
  }
  await savePendingPostToX(parsed.callId, {
    ...pending,
    accountId: parsed.accountId,
    username: parsed.username,
  });
}

export async function dismissPostToXConfirmCard(
  ctx: SlackInteractionContext,
  messageTs: string | undefined
): Promise<void> {
  if (!messageTs) {
    return;
  }
  await ctx.slack.request("chat.update", {
    channel: ctx.slack.channelId,
    ts: messageTs,
    text: "Canceled. The draft card above is still active.",
    blocks: [],
  });
}

export function parsePostToXConfirmValue(
  value: string | undefined
): { requestId: string; callId: string; username: string } | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "requestId" in parsed &&
      typeof parsed.requestId === "string" &&
      "callId" in parsed &&
      typeof parsed.callId === "string" &&
      "username" in parsed &&
      typeof parsed.username === "string"
    ) {
      return {
        requestId: parsed.requestId,
        callId: parsed.callId,
        username: parsed.username,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function publishPendingPostToX(
  callId: string,
  turnId: string
): Promise<PostToXOutcome | undefined> {
  const pending = await readPendingPostToX(callId).catch(() => null);
  if (!pending) {
    return undefined;
  }

  return Effect.runPromise(
    publishTwitterPost({
      organizationId: pending.organizationId,
      accountId: pending.accountId,
      content: pending.text,
    }).pipe(
      Effect.map((result): PostToXOutcome => ({
        turnId,
        postUrl: result.postUrl,
        failed: false,
        confirmed: result.confirmed,
      })),
      Effect.catch((error) =>
        Effect.logWarning("[agent] Post to X failed", error).pipe(
          Effect.as<PostToXOutcome>({
            turnId,
            postUrl: null,
            failed: true,
            confirmed: false,
          })
        )
      )
    )
  );
}

export function getPostToXCompletionMessage(
  outcome: PostToXOutcome | undefined,
  turnId: string
): string {
  if (!outcome || outcome.turnId !== turnId) {
    return "Nice, glad that worked. Want me to save this as a reference?";
  }
  if (outcome.failed) {
    return "Posting to X failed. The draft card above is still active, so you can try again or save it as a draft.";
  }
  if (!outcome.confirmed) {
    return "The post was sent to X, but confirmation timed out. Check the account before retrying to avoid a duplicate.";
  }
  if (outcome.postUrl) {
    return `Posted to X: <${outcome.postUrl}|view the post>. Want me to save it as a reference?`;
  }
  return "Posted to X. Want me to save it as a reference?";
}
