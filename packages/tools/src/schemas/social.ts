import { Schema } from "effect";

export class SocialPublishError extends Schema.TaggedErrorClass<SocialPublishError>()(
  "SocialPublishError",
  {
    cause: Schema.Defect(),
    message: Schema.String,
  }
) {}
