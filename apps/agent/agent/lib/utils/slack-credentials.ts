import type { SlackChannelCredentials } from "eve/channels/slack";

import { resolveSlackOutboundBotToken } from "./slack-installation";

function requireEnv(name: string, purpose: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for ${purpose}`);
  }

  return value;
}

export function createSlackAgentCredentials(): SlackChannelCredentials {
  return {
    botToken: () => resolveSlackOutboundBotToken(),
    get signingSecret(): string {
      return requireEnv(
        "SLACK_AGENT_SIGNING_SECRET",
        "Slack webhook verification"
      );
    },
  };
}
