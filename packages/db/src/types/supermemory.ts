export interface BrandReferenceMemoryPayload {
  organizationId: string;
  voiceId: string;
  referenceId: string;
  type: string;
  content: string;
  note?: string | null;
  applicableTo: string[];
  tweetId?: string | null;
  sourceUrl?: string | null;
}

export interface BrandReferenceMemoryLink {
  documentId: string | null;
  memoryId: string | null;
}

export interface DeleteBrandReferenceMemoryInput {
  customId?: string | null;
  documentId?: string | null;
}

export interface SupermemorySearchResult {
  id?: string;
  memory?: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}
