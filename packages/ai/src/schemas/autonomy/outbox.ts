import { Data } from "effect";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const irisOutboxArtifactSchema = z.object({
  postId: z.string().min(1),
  title: z.string().min(1),
  contentType: z.string().min(1),
  excerpt: z.string(),
  imageUrl: z.url().nullish(),
  status: z.enum(["draft", "published"]),
});
export type IrisOutboxArtifact = z.infer<typeof irisOutboxArtifactSchema>;

export const irisOutboxDeliverySchema = z.object({
  channel: z.string().min(1),
  ts: z.string().min(1),
  teamId: z.string().min(1),
  deliveredAt: z.iso.datetime(),
});
export type IrisOutboxDelivery = z.infer<typeof irisOutboxDeliverySchema>;

export const irisApprovalActionSchema = z.enum(["shipped", "skipped"]);
export type IrisApprovalAction = z.infer<typeof irisApprovalActionSchema>;

export const irisApprovalSchema = z.object({
  postId: z.string().min(1),
  action: irisApprovalActionSchema,
  slackUserId: z.string().min(1),
  slackUserName: z.string().min(1).nullable(),
  at: z.iso.datetime(),
});
export type IrisApproval = z.infer<typeof irisApprovalSchema>;

export const irisOutboxPayloadSchema = z.object({
  kind: z.enum(["run_summary", "no_op"]),
  runId: z.string().min(1),
  headline: z.string().min(1),
  signalCount: z.number().int().min(0),
  artifacts: z.array(irisOutboxArtifactSchema).default([]),
  trigger: z.string().min(1),
  organizationSlug: z.string().min(1).nullish(),
  delivery: irisOutboxDeliverySchema.nullish(),
  approvals: z.array(irisApprovalSchema).optional(),
});
export type IrisOutboxPayload = z.infer<typeof irisOutboxPayloadSchema>;

export class IrisOutboxPersistenceError extends Data.TaggedError(
  "IrisOutboxPersistenceError"
)<{
  readonly outboxId: string;
  readonly operation: string;
  readonly cause: unknown;
}> {}

export class IrisOutboxPayloadError extends Data.TaggedError(
  "IrisOutboxPayloadError"
)<{
  readonly outboxId: string;
  readonly issues: string;
}> {}
