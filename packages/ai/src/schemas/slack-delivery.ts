import { Data } from "effect";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const slackApiResponseSchema = z
  .object({
    ok: z.boolean(),
    error: z.string().optional(),
    channel: z.string().optional(),
    ts: z.string().optional(),
  })
  .refine(
    (response) =>
      !response.ok ||
      ((response.channel?.length ?? 0) > 0 && (response.ts?.length ?? 0) > 0),
    {
      message: "A successful Slack response must include a channel and a ts",
      path: ["ts"],
    }
  );
export type SlackApiResponse = z.infer<typeof slackApiResponseSchema>;

export const irisShipActionValueSchema = z.object({
  postId: z.string().min(1),
  organizationId: z.string().min(1),
  outboxId: z.string().min(1),
});

export class SlackChannelNotConfiguredError extends Data.TaggedError(
  "SlackChannelNotConfiguredError"
)<{
  readonly organizationId: string;
}> {}

export class SlackDeliveryTerminalError extends Data.TaggedError(
  "SlackDeliveryTerminalError"
)<{
  readonly code: string;
  readonly operation: string;
  readonly organizationId: string;
}> {}

export class SlackDeliveryRetryableError extends Data.TaggedError(
  "SlackDeliveryRetryableError"
)<{
  readonly code: string;
  readonly operation: string;
  readonly organizationId: string;
  readonly retryAfterSeconds: number | null;
  readonly cause: unknown;
}> {}

export type SlackDeliveryError =
  | SlackChannelNotConfiguredError
  | SlackDeliveryTerminalError
  | SlackDeliveryRetryableError;
