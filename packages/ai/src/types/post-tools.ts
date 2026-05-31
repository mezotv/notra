import type { ContentType } from "@notra/ai/schemas/content";
import type { PostSourceMetadata } from "@notra/db/schema";
import type { PostSummary } from "./posts";

export interface PostToolsConfig {
  organizationId: string;
  collectionId?: string;
  contentType: ContentType;
  sourceMetadata?: PostSourceMetadata;
  autoPublish?: boolean;
  needsApproval?: boolean;
}

export interface PostToolsResult {
  postId?: string;
  title?: string;
  posts?: PostSummary[];
  failReason?: string;
  skipReason?: string;
}
