import { type SlackChannelConfig, slackChannel } from "eve/channels/slack";
import { createNotraSlackAuth } from "../lib/utils/slack-auth";
import { mirrorSlackInboundMessage } from "../lib/utils/slack-chat-mirror";
import { createSlackAgentCredentials } from "../lib/utils/slack-credentials";
import { handleSlackInputRequested } from "../lib/utils/slack-input-request";

const CREATE_POST_TOOL_NAMES = new Set([
  "create_blog_post",
  "create_changelog",
  "create_investor_update",
  "create_linkedin_post",
  "create_twitter_post",
]);

interface DraftCompletionState {
  count: number;
  turnId: string;
}

function isPostToXRejection(output: unknown): boolean {
  if (
    typeof output !== "object" ||
    output === null ||
    Array.isArray(output) ||
    !("approval" in output)
  ) {
    return false;
  }

  const { approval } = output;
  return (
    typeof approval === "object" &&
    approval !== null &&
    !Array.isArray(approval) &&
    "status" in approval &&
    approval.status === "invalid"
  );
}

function firstNonEmptyLine(value: string): string | null {
  for (const line of value.split(/\r?\n/gu)) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}

const onSlackMessage: NonNullable<SlackChannelConfig["onAppMention"]> = async (
  ctx,
  message
) => {
  const auth = createNotraSlackAuth(ctx, message);
  if (!auth) {
    return null;
  }

  await ctx.thread.startTyping("Thinking...");
  try {
    const organizationId = auth.attributes.organizationId;
    if (
      typeof organizationId === "string" &&
      message.raw.channel_type === "channel"
    ) {
      const chatId = await mirrorSlackInboundMessage(
        ctx,
        message,
        organizationId
      );
      return {
        auth: {
          ...auth,
          attributes: { ...auth.attributes, chatId },
        },
      };
    }
  } catch (error) {
    console.error("[agent] Slack inbound chat mirror failed", error);
  }

  return { auth };
};

const onSlackThreadReply: NonNullable<SlackChannelConfig["onMessage"]> = async (
  ctx,
  message
) => {
  if (message.author?.isBot || !(await ctx.isSubscribed())) {
    return null;
  }

  return onSlackMessage(ctx, message);
};

export default slackChannel({
  credentials: createSlackAgentCredentials(),
  events: {
    "action.result": (data, channel) => {
      const result = data.result;

      if (
        data.status === "rejected" &&
        result.kind === "tool-result" &&
        result.toolName === "create_twitter_post" &&
        isPostToXRejection(result.output)
      ) {
        const state = channel.state as typeof channel.state & {
          notraPostToXTurnId?: string;
        };
        state.notraPostToXTurnId = data.turnId;
        return;
      }

      if (
        data.status !== "completed" ||
        result.kind !== "tool-result" ||
        result.isError
      ) {
        return;
      }

      const state = channel.state as typeof channel.state & {
        notraDraftCompletion?: DraftCompletionState;
        notraReferenceCompletionTurnId?: string;
      };
      if (result.toolName === "add_reference") {
        state.notraReferenceCompletionTurnId = data.turnId;
        return;
      }

      if (!CREATE_POST_TOOL_NAMES.has(result.toolName)) {
        return;
      }

      const current = state.notraDraftCompletion;
      state.notraDraftCompletion = {
        count: current?.turnId === data.turnId ? current.count + 1 : 1,
        turnId: data.turnId,
      };
    },
    "input.requested": handleSlackInputRequested,
    "message.completed": async (data, channel) => {
      if (data.finishReason === "tool-calls") {
        channel.state.pendingToolCallMessage = data.message
          ? firstNonEmptyLine(data.message)
          : null;
        return;
      }

      channel.state.pendingToolCallMessage = null;
      const state = channel.state as typeof channel.state & {
        notraDraftCompletion?: DraftCompletionState;
        notraPostToXTurnId?: string;
        notraReferenceCompletionTurnId?: string;
      };
      const completion = state.notraDraftCompletion;
      const postToXTurnId = state.notraPostToXTurnId;
      const referenceCompletionTurnId = state.notraReferenceCompletionTurnId;
      state.notraDraftCompletion = undefined;
      state.notraPostToXTurnId = undefined;
      state.notraReferenceCompletionTurnId = undefined;

      if (postToXTurnId === data.turnId) {
        await channel.thread.post(
          "Nice, glad that worked. Want me to save this as a reference?"
        );
        return;
      }

      if (referenceCompletionTurnId === data.turnId) {
        await channel.thread.post("Saved as a reference.");
        return;
      }

      if (completion?.turnId === data.turnId) {
        await channel.thread.post(
          completion.count === 1
            ? "Saved as a draft."
            : `Saved ${completion.count} drafts.`
        );
        return;
      }

      if (data.message) {
        await channel.thread.post(data.message);
      } else {
        await channel.thread.startTyping();
      }
    },
    "reasoning.appended": () => undefined,
  },
  onAppMention: onSlackMessage,
  onDirectMessage: onSlackMessage,
  onMessage: onSlackThreadReply,
  threadContext: { since: "last-agent-reply" },
});
