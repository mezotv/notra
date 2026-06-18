import {
  MARKDOWN_MEDIA_TYPE,
  PLAIN_TEXT_MEDIA_TYPE,
} from "@notra/ai/constants/media-types";
import type { UIMessage } from "ai";

type MessagePart = UIMessage["parts"][number];

function normalizeFilePartMediaType(part: MessagePart): MessagePart {
  if (
    part.type === "file" &&
    typeof part.mediaType === "string" &&
    part.mediaType.toLowerCase() === MARKDOWN_MEDIA_TYPE
  ) {
    // Anthropic's "File types and content blocks" section only maps plain text
    // (`text/plain`) to document blocks, so Markdown files are sent as plain
    // text documents while preserving the attachment/document-block flow.
    // https://platform.claude.com/docs/en/build-with-claude/files#file-types-and-content-blocks
    return {
      ...part,
      mediaType: PLAIN_TEXT_MEDIA_TYPE,
    };
  }

  return part;
}

export function normalizeMarkdownFileAttachments<TMessage extends UIMessage>(
  messages: TMessage[]
): TMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map(normalizeFilePartMediaType),
  }));
}
