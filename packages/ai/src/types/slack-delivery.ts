export type SlackBlockValue =
  | string
  | number
  | boolean
  | null
  | readonly SlackBlockValue[]
  | { readonly [key: string]: SlackBlockValue };

export interface SlackBlock {
  readonly [key: string]: SlackBlockValue;
}

export interface SlackApiRequestBody {
  readonly [key: string]: SlackBlockValue;
}

export interface SlackMessageContent {
  text: string;
  blocks: readonly SlackBlock[];
}

export interface PostSlackMessageInput {
  organizationId: string;
  text: string;
  blocks?: readonly SlackBlock[];
}

export interface PostSlackMessageResult {
  channel: string;
  ts: string;
  teamId: string;
}

export interface UpdateSlackMessageInput {
  organizationId: string;
  teamId?: string | null;
  channel: string;
  ts: string;
  text: string;
  blocks?: readonly SlackBlock[];
}

export interface UpdateSlackMessageResult {
  channel: string;
  ts: string;
}

export type IrisArtifactStatus = "draft" | "published";

export interface IrisArtifactBlockInput {
  postId: string;
  title: string;
  contentType: string;
  excerpt: string;
  imageUrl?: string | null;
  status: IrisArtifactStatus;
}

export interface IrisRunBlocksInput {
  organizationId: string;
  organizationSlug: string | null;
  outboxId: string;
  runId: string;
  headline: string;
  signalCount: number;
  trigger: string;
  artifacts: readonly IrisArtifactBlockInput[];
}

export interface IrisNoOpBlocksInput {
  headline: string;
  signalCount: number;
  trigger: string;
}

export type IrisDecisionOutcome = "shipped" | "skipped";

export interface IrisArtifactDecision {
  postId: string;
  decidedBy: string;
  outcome: IrisDecisionOutcome;
}

export interface IrisShippedBlocksInput extends IrisRunBlocksInput {
  decisions: readonly IrisArtifactDecision[];
}

export interface IrisShipActionValue {
  postId: string;
  organizationId: string;
  outboxId: string;
}
