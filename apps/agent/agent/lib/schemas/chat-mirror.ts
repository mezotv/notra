import { Schema } from "effect";

export class ChatMirrorError extends Schema.TaggedErrorClass<ChatMirrorError>()(
  "ChatMirrorError",
  {
    cause: Schema.Defect(),
    operation: Schema.String,
  }
) {}
