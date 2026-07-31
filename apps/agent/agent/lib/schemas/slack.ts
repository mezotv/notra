import { Schema } from "effect";

export class SlackApiError extends Schema.TaggedErrorClass<SlackApiError>()(
  "SlackApiError",
  {
    cause: Schema.Defect(),
    operation: Schema.String,
  }
) {}
