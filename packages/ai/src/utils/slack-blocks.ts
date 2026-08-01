import {
  IRIS_EXCERPT_MAX_LENGTH,
  IRIS_HEADLINE_MAX_LENGTH,
  IRIS_MAX_CARD_ARTIFACTS,
  IRIS_REVIEW_ACTION_ID,
  IRIS_SHIP_ACTION_ID,
  IRIS_SKIP_ACTION_ID,
  IRIS_TITLE_MAX_LENGTH,
} from "../constants/slack-delivery";
import type {
  IrisArtifactBlockInput,
  IrisArtifactDecision,
  IrisNoOpBlocksInput,
  IrisRunBlocksInput,
  IrisShippedBlocksInput,
  SlackBlock,
  SlackMessageContent,
} from "../types/slack-delivery";
import { getConfiguredAppUrl } from "./url";

const SLACK_TEXT_ESCAPES: ReadonlyArray<readonly [RegExp, string]> = [
  [/&/gu, "&amp;"],
  [/</gu, "&lt;"],
  [/>/gu, "&gt;"],
];

const WHITESPACE_RUN_REGEX = /\s+/gu;

export function escapeSlackText(value: string): string {
  let escaped = value;
  for (const [pattern, replacement] of SLACK_TEXT_ESCAPES) {
    escaped = escaped.replace(pattern, replacement);
  }
  return escaped;
}

function truncate(value: string, maxLength: number): string {
  const collapsed = value.replace(WHITESPACE_RUN_REGEX, " ").trim();
  if (collapsed.length <= maxLength) {
    return collapsed;
  }
  return `${collapsed.slice(0, maxLength - 1).trimEnd()}…`;
}

function safeText(value: string, maxLength: number): string {
  return escapeSlackText(truncate(value, maxLength));
}

function buildReviewUrl(
  organizationSlug: string | null,
  postId: string
): string | null {
  const appUrl = getConfiguredAppUrl();
  if (!(appUrl && organizationSlug)) {
    return null;
  }
  return `${appUrl}/${organizationSlug}/content/${postId}`;
}

function headerBlock(): SlackBlock {
  return {
    type: "header",
    text: { type: "plain_text", text: "Iris", emoji: true },
  };
}

function headlineBlock(headline: string): SlackBlock {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${safeText(headline, IRIS_HEADLINE_MAX_LENGTH)}*`,
    },
  };
}

function contextBlock(signalCount: number, trigger: string): SlackBlock {
  const signalLabel = signalCount === 1 ? "signal" : "signals";
  return {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `${signalCount} ${signalLabel} reviewed  |  Trigger: ${safeText(trigger, IRIS_TITLE_MAX_LENGTH)}`,
      },
    ],
  };
}

function noteBlock(text: string): SlackBlock {
  return {
    type: "context",
    elements: [{ type: "mrkdwn", text }],
  };
}

function artifactSectionBlock(
  artifact: IrisArtifactBlockInput,
  reviewUrl: string | null
): SlackBlock {
  const body = `*${safeText(artifact.title, IRIS_TITLE_MAX_LENGTH)}*\n${safeText(artifact.contentType, IRIS_TITLE_MAX_LENGTH)}\n${safeText(artifact.excerpt, IRIS_EXCERPT_MAX_LENGTH)}`;

  if (!reviewUrl) {
    return { type: "section", text: { type: "mrkdwn", text: body } };
  }

  return {
    type: "section",
    text: { type: "mrkdwn", text: body },
    accessory: {
      type: "button",
      action_id: `${IRIS_REVIEW_ACTION_ID}:${artifact.postId}`,
      text: { type: "plain_text", text: "Review in Notra", emoji: true },
      url: reviewUrl,
      value: artifact.postId,
    },
  };
}

function artifactImageBlock(
  artifact: IrisArtifactBlockInput
): readonly SlackBlock[] {
  if (!artifact.imageUrl) {
    return [];
  }
  return [
    {
      type: "image",
      image_url: artifact.imageUrl,
      alt_text: safeText(artifact.title, IRIS_TITLE_MAX_LENGTH),
    },
  ];
}

function artifactActionsBlock(
  artifact: IrisArtifactBlockInput,
  input: IrisRunBlocksInput
): SlackBlock {
  const actionValue = JSON.stringify({
    postId: artifact.postId,
    organizationId: input.organizationId,
    outboxId: input.outboxId,
  });

  return {
    type: "actions",
    block_id: `iris_actions:${artifact.postId}`,
    elements: [
      {
        type: "button",
        action_id: IRIS_SHIP_ACTION_ID,
        style: "primary",
        text: { type: "plain_text", text: "Ship it", emoji: true },
        value: actionValue,
      },
      {
        type: "button",
        action_id: IRIS_SKIP_ACTION_ID,
        text: { type: "plain_text", text: "Skip", emoji: true },
        value: actionValue,
      },
    ],
  };
}

function artifactBlocks(
  input: IrisRunBlocksInput,
  decisions: readonly IrisArtifactDecision[]
): readonly SlackBlock[] {
  const blocks: SlackBlock[] = [];
  const decisionByPostId = new Map(
    decisions.map((decision) => [decision.postId, decision])
  );

  for (const artifact of input.artifacts.slice(0, IRIS_MAX_CARD_ARTIFACTS)) {
    blocks.push({ type: "divider" });
    blocks.push(
      artifactSectionBlock(
        artifact,
        buildReviewUrl(input.organizationSlug, artifact.postId)
      )
    );
    blocks.push(...artifactImageBlock(artifact));

    const decision = decisionByPostId.get(artifact.postId);
    if (decision) {
      const verb = decision.outcome === "shipped" ? "Shipped" : "Skipped";
      blocks.push(
        noteBlock(
          `${verb} by ${safeText(decision.decidedBy, IRIS_TITLE_MAX_LENGTH)}`
        )
      );
      continue;
    }

    if (artifact.status === "published") {
      blocks.push(noteBlock("Published"));
      continue;
    }

    blocks.push(artifactActionsBlock(artifact, input));
  }

  return blocks;
}

function buildRunCard(
  input: IrisRunBlocksInput,
  decisions: readonly IrisArtifactDecision[]
): SlackMessageContent {
  return {
    text: `Iris: ${safeText(input.headline, IRIS_HEADLINE_MAX_LENGTH)}`,
    blocks: [
      headerBlock(),
      headlineBlock(input.headline),
      contextBlock(input.signalCount, input.trigger),
      ...artifactBlocks(input, decisions),
    ],
  };
}

export function buildIrisRunBlocks(
  input: IrisRunBlocksInput
): SlackMessageContent {
  return buildRunCard(input, []);
}

export function buildShippedBlocks(
  input: IrisShippedBlocksInput
): SlackMessageContent {
  return buildRunCard(input, input.decisions);
}

export function buildIrisNoOpBlocks(
  input: IrisNoOpBlocksInput
): SlackMessageContent {
  return {
    text: `Iris: ${safeText(input.headline, IRIS_HEADLINE_MAX_LENGTH)}`,
    blocks: [
      headlineBlock(input.headline),
      contextBlock(input.signalCount, input.trigger),
    ],
  };
}
