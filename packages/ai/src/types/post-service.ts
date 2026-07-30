import type { ContentType } from "@notra/ai/schemas/content";
import type { PostSourceMetadata } from "@notra/db/schema";

export interface CreatePostRecordParams {
  organizationId: string;
  collectionId: string;
  contentType: ContentType;
  title: string;
  slug?: string | null;
  markdown: string;
  recommendations?: string | null;
  autoPublish?: boolean;
  sourceMetadata?: PostSourceMetadata | null;
  postId?: string;
}

export interface CreatePostRecordResult {
  postId: string;
  deduplicated: boolean;
}

export interface UpdatePostRecordParams {
  organizationId: string;
  postId: string;
  title?: string;
  slug?: string | null;
  markdown?: string;
  recommendations?: string | null;
}

export interface UpdatePostRecordResult {
  status: "updated" | "not_found" | "no_changes";
}

export interface EnsureChatPostCollectionParams {
  organizationId: string;
  chatId?: string | null;
  contentType: ContentType;
}
