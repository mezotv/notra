export interface BrandReferenceMemorySyncSuccess {
  documentId: string | null;
  memoryId: string | null;
  referenceId: string;
  status: "synced";
}

export interface BrandReferenceMemorySyncFailure {
  error: string;
  referenceId: string;
  status: "failed";
}

export type BrandReferenceMemorySyncResult =
  | BrandReferenceMemorySyncSuccess
  | BrandReferenceMemorySyncFailure;

export interface SyncPersistedBrandReferenceMemoryInput {
  organizationId: string;
  referenceId: string;
  voiceId: string;
}
