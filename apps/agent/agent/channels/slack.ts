import { Effect } from "effect";
import { type SlackChannelConfig, slackChannel } from "eve/channels/slack";
import { CREATE_POST_TOOL_NAMES } from "../lib/constants/slack";
import { createNotraSlackAuth } from "../lib/utils/slack-auth";
import { mirrorPublicSlackThread } from "../lib/utils/slack-chat-mirror";
import { createSlackAgentCredentials } from "../lib/utils/slack-credentials";
import { handleSlackInputRequested } from "../lib/utils/slack-input-request";
import { getNotraSlackState } from "../lib/utils/slack-state";
import { isPostToXRejection } from "../lib/utils/slack-tool-results";
import { firstNonEmptyLine } from "../lib/utils/text";

const onSlackMessage: NonNullable<SlackChannelConfig["onAppMention"]> = async (
  ctx,
  message
) => {
  const auth = createNotraSlackAuth(ctx, message);
  if (!auth) {
    return null;
  }

  await ctx.thread.startTyping("Thinking...");
  const chatId = await Effect.runPromise(
    mirrorPublicSlackThread(ctx, message, auth.attributes.organizationId)
  );
  if (chatId) {
    return {
      auth: {
        ...auth,
        attributes: { ...auth.attributes, chatId },
      },
    };
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
      const state = getNotraSlackState(channel.state);

      if (
        data.status === "rejected" &&
        result.kind === "tool-result" &&
        result.toolName === "create_twitter_post" &&
        isPostToXRejection(result.output)
      ) {
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
      const state = getNotraSlackState(channel.state);
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
