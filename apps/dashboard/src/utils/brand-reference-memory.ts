import {
  buildBrandReferenceMemoryPayload,
  createBrandReferenceMemory,
  deleteBrandReferenceMemory,
} from "@notra/db/utils/supermemory";

export interface ReferenceMemoryRecord {
  id: string;
  type: string;
  content: string;
  note: string | null;
  applicableTo: string[];
  metadata: Record<string, unknown> | null;
  supermemoryDocumentId: string | null;
}

export async function syncBrandReferenceMemory(input: {
  organizationId: string;
  voiceId: string;
  reference: ReferenceMemoryRecord;
}) {
  return createBrandReferenceMemory(buildBrandReferenceMemoryPayload(input));
}

export async function removeBrandReferenceMemory(
  reference: ReferenceMemoryRecord
) {
  return deleteBrandReferenceMemory({
    documentId: reference.supermemoryDocumentId,
  });
}
