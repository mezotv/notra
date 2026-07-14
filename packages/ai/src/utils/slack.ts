import {
  SLACK_CHANNEL_NAME_MAX_LENGTH,
  SLACK_EDGE_HYPHENS_REGEX,
  SLACK_EXTERNAL_CHANNEL_PREFIX,
  SLACK_EXTERNAL_CHANNEL_SUFFIX,
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

  const companySlugMaxLength =
    SLACK_CHANNEL_NAME_MAX_LENGTH -
    SLACK_EXTERNAL_CHANNEL_PREFIX.length -
    SLACK_EXTERNAL_CHANNEL_SUFFIX.length;
  return `${SLACK_EXTERNAL_CHANNEL_PREFIX}${slug.slice(0, companySlugMaxLength)}${SLACK_EXTERNAL_CHANNEL_SUFFIX}`;
}
