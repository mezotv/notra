import {
  SLACK_CHANNEL_NAME_MAX_LENGTH,
  SLACK_EDGE_HYPHENS_REGEX,
  SLACK_HYPHEN_RUNS_REGEX,
  SLACK_INVALID_CHANNEL_CHARS_REGEX,
} from "../constants/slack";

export function buildExternalChannelName(companyName: string): string {
  const slug = companyName
    .toLowerCase()
    .replace(SLACK_INVALID_CHANNEL_CHARS_REGEX, "-")
    .replace(SLACK_HYPHEN_RUNS_REGEX, "-")
    .replace(SLACK_EDGE_HYPHENS_REGEX, "");

  if (!slug) {
    throw new Error("Company name produces an empty Slack channel name");
  }

  return `ext-${slug}-notra`.slice(0, SLACK_CHANNEL_NAME_MAX_LENGTH);
}
