import type { ContentResponse, PostCollectionContext } from "@/schemas/content";

export interface ContentApiResponse {
  content: ContentResponse;
  collection: PostCollectionContext | null;
}
