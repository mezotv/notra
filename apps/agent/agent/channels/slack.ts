import { disableSlackIntegrationByTeamId } from "@notra/ai/integrations/slack-workspace";
import { Effect } from "effect";
import { type SlackChannelConfig, slackChannel } from "eve/channels/slack";
import { CREATE_POST_TOOL_NAMES } from "../lib/constants/slack";
import {
  mirrorAssistantDelta,
  mirrorSessionStatus,
  mirrorToolApprovals,
  mirrorToolResult,
} from "../lib/utils/chat-mirror";
import { buildNotraSlackAuth } from "../lib/utils/slack-auth";
import { mirrorPublicSlackThread } from "../lib/utils/slack-chat-mirror";
import { createSlackAgentCredentials } from "../lib/utils/slack-credentials";
import { handleSlackInputRequested } from "../lib/utils/slack-input-request";
import {
  isChannelAllowed,
  resolveSlackInstallation,
  runWithSlackInstallation,
  runWithSlackTeam,
} from "../lib/utils/slack-installation";
import {
  getChannelNotEnabledMessage,
  notifySlackDraftCreated,
} from "../lib/utils/slack-notifications";
import { parseSlackDashboardRelay } from "../lib/utils/slack-relay";
import { getNotraSlackState } from "../lib/utils/slack-state";
import { isPostToXRejection } from "../lib/utils/slack-tool-results";
import { firstNonEmptyLine } from "../lib/utils/text";

const onSlackMessage: NonNullable<SlackChannelConfig["onAppMention"]> = async (
  ctx,
  message
) => {
  if (!message.teamId) {
    return null;
  }
  const installation = await resolveSlackInstallation(message.teamId);
  if (!installation) {
    return null;
  }

  if (!isChannelAllowed(installation, message.channelId)) {
    const userId = message.author?.userId;
    if (ctx.isBotMentioned() && userId) {
      await runWithSlackInstallation(installation, () =>
        ctx.thread.postEphemeral(
          userId,
          getChannelNotEnabledMessage(installation)
        )
      );
    }
    return null;
  }

  const auth = buildNotraSlackAuth(ctx, message, installation);
  if (!auth) {
    return null;
  }

  return runWithSlackInstallation(installation, async () => {
    await ctx.thread.startTyping("Thinking...");
    const chatId = await Effect.runPromise(
      mirrorPublicSlackThread(ctx, message, installation.organizationId)
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
  });
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

const onSlackEvent: NonNullable<SlackChannelConfig["onEvent"]> = async (
  ctx,
  event
) => {
  if (
    (event.type === "app_uninstalled" || event.type === "tokens_revoked") &&
    ctx.envelope.team_id
  ) {
    await disableSlackIntegrationByTeamId(ctx.envelope.team_id);
    return;
  }

  const relay = await parseSlackDashboardRelay(ctx.envelope, event);
  if (!relay) {
    return;
  }

  await runWithSlackTeam(ctx.envelope.team_id, () =>
    ctx.receive({
      message: relay.message,
      target: { channelId: relay.channelId, threadTs: relay.threadTs },
      auth: relay.auth,
    })
  );
};

export default slackChannel({
  credentials: createSlackAgentCredentials(),
  events: {
    "action.result": async (data, channel, ctx) => {
      await mirrorToolResult(ctx, data);
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
      await notifySlackDraftCreated(ctx, result.toolName);
    },
    "message.appended": async (data, _channel, ctx) => {
      await mirrorAssistantDelta(ctx, data);
    },
    "input.requested": (data, channel, ctx) =>
      runWithSlackTeam(channel.state.teamId, async () => {
        await handleSlackInputRequested(data, channel);
        await mirrorToolApprovals(ctx, data);
        await mirrorSessionStatus(ctx, "idle");
      }),
    "message.completed": (data, channel, ctx) =>
      runWithSlackTeam(channel.state.teamId, async () => {
        if (data.finishReason === "tool-calls") {
          channel.state.pendingToolCallMessage = data.message
            ? firstNonEmptyLine(data.message)
            : null;
          return;
        }

        await mirrorSessionStatus(ctx, "idle");
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
      }),
    "reasoning.appended": () => undefined,
    "turn.started": (_data, channel, ctx) =>
      runWithSlackTeam(channel.state.teamId, async () => {
        channel.state.pendingToolCallMessage = null;
        channel.state.lastReasoningTypingAtMs = null;
        channel.state.lastReasoningTypingStatus = null;
        await channel.thread.startTyping("Working...");
        await mirrorSessionStatus(ctx, "working");
      }),
  },
  onAppMention: onSlackMessage,
  onDirectMessage: onSlackMessage,
  onEvent: onSlackEvent,
  onMessage: onSlackThreadReply,
  threadContext: { since: "last-agent-reply" },
});
