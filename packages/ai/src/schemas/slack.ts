import { Schema } from "effect";
import { z } from "zod";

export class SlackConfigurationError extends Schema.TaggedErrorClass<SlackConfigurationError>()(
  "SlackConfigurationError",
  { variable: Schema.String }
) {}

export class SlackInputError extends Schema.TaggedErrorClass<SlackInputError>()(
  "SlackInputError",
  { message: Schema.String }
) {}

export class SlackRequestError extends Schema.TaggedErrorClass<SlackRequestError>()(
  "SlackRequestError",
  {
    cause: Schema.Defect(),
    operation: Schema.String,
    status: Schema.optional(Schema.Number),
  }
) {}

export class SlackResponseError extends Schema.TaggedErrorClass<SlackResponseError>()(
  "SlackResponseError",
  {
    cause: Schema.Defect(),
    operation: Schema.String,
  }
) {}

export class SlackApiError extends Schema.TaggedErrorClass<SlackApiError>()(
  "SlackApiError",
  {
    code: Schema.String,
    operation: Schema.String,
  }
) {}

export class SlackSetupError extends Schema.TaggedErrorClass<SlackSetupError>()(
  "SlackSetupError",
  {
    archiveCause: Schema.optional(Schema.Defect()),
    archived: Schema.Boolean,
    cause: Schema.Defect(),
    channelName: Schema.String,
  }
) {}

export const slackInviteSharedResponseSchema = z.looseObject({
  ok: z.boolean(),
  error: z.string().optional(),
  invite_id: z.string().optional(),
  is_legacy_shared_channel: z.boolean().optional(),
});

export const slackOkResponseSchema = z.looseObject({
  ok: z.boolean(),
  error: z.string().optional(),
});

export const slackCreateChannelResponseSchema = z.looseObject({
  ok: z.boolean(),
  error: z.string().optional(),
  channel: z
    .looseObject({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});
