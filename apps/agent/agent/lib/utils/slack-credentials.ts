import type { SlackChannelCredentials } from "eve/channels/slack";

export function createSlackAgentCredentials(): SlackChannelCredentials {
  return {
    botToken: () => {
      const botToken = process.env.SLACK_AGENT_BOT_TOKEN?.trim();

      if (!botToken) {
        throw new Error("SLACK_AGENT_BOT_TOKEN is required for Slack delivery");
      }

      return botToken;
    },
    signingSecret: process.env.SLACK_AGENT_SIGNING_SECRET?.trim() ?? "",
  };
}
