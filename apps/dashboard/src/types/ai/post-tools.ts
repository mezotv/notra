import type { PostSourceMetadata } from "@notra/db/schema";
import type { ContentType } from "@/schemas/content";

export interface PostToolsConfig {
  organizationId: string;
  contentType: ContentType;
  sourceMetadata?: PostSourceMetadata;
}

export interface CreatedPostSummary {
  postId: string;
  title: string;
}

export interface PostToolsResult {
  postId?: string;
  title?: string;
  posts?: CreatedPostSummary[];
  failReason?: string;
}
