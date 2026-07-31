import { redis } from "@notra/ai/utils/redis";
import { publishTwitterPost } from "@notra/tools/utils/social-publish";
import { Effect } from "effect";
import type {
  SlackInteractionContext,
  SlackPostInput,
} from "eve/channels/slack";
import {
  POST_TO_X_CANCEL_ACTION_PREFIX,
  POST_TO_X_CONFIRM_ACTION_PREFIX,
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
  username: string;
}): SlackPostInput {
  const plainText = (value: string) => ({
    type: "plain_text" as const,
    text: value,
    emoji: true,
  });

  return {
    text: `Post this tweet to X as @${input.username}?`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Post this tweet to X as *@${input.username}*? It publishes immediately.`,
        },
      },
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
): { requestId: string; username: string } | null {
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
      "username" in parsed &&
      typeof parsed.username === "string"
    ) {
      return { requestId: parsed.requestId, username: parsed.username };
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
      Effect.map(
        (result): PostToXOutcome => ({
          turnId,
          postUrl: result.postUrl,
          failed: false,
        })
      ),
      Effect.catch((error) =>
        Effect.logWarning("[agent] Post to X failed", error).pipe(
          Effect.as<PostToXOutcome>({ turnId, postUrl: null, failed: true })
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
  if (outcome.postUrl) {
    return `Posted to X: <${outcome.postUrl}|view the post>. Want me to save it as a reference?`;
  }
  return "Posted to X. Want me to save it as a reference?";
}
