import type { ContextItem, TextSelection } from "@notra/ai/types/chat";
import type { z } from "zod";

import type { contentChatMessageMetadataSchema } from "@/schemas/content";

export type ContentChatMessageMetadata = z.infer<
  typeof contentChatMessageMetadataSchema
>;

export interface ContentChatAttachments {
  selection: TextSelection | null;
  context: ContextItem[];
}
