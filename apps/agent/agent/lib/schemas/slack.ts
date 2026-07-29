import { Schema } from "effect";

export class SlackApiError extends Schema.TaggedErrorClass<SlackApiError>()(
  "SlackApiError",
  {
    cause: Schema.Defect(),
    operation: Schema.String,
  }
) {}

export class SlackChatMirrorError extends Schema.TaggedErrorClass<SlackChatMirrorError>()(
  "SlackChatMirrorError",
  {
    cause: Schema.Defect(),
    operation: Schema.String,
  }
) {}
