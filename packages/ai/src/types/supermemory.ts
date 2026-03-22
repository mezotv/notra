export interface SupermemoryReferenceSearchResult {
  id?: string;
  memory?: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}
