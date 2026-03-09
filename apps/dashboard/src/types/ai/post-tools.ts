import type { PostSourceMetadata } from "@notra/db/schema";
import type { ContentType } from "@/schemas/content";
import type { PostSummary } from "@/types/posts";

export interface PostToolsConfig {
  organizationId: string;
  contentType: ContentType;
  sourceMetadata?: PostSourceMetadata;
}

export interface PostToolsResult {
  postId?: string;
  title?: string;
  posts?: PostSummary[];
  failReason?: string;
}
