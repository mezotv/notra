import { and, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { brandReferences } from "../schema";
import type {
  BrandReferenceMemorySyncResult,
  SyncPersistedBrandReferenceMemoryInput,
} from "../types/brand-reference-memory";
import {
  buildBrandReferenceMemoryPayload,
  createBrandReferenceMemory,
  getBrandReferenceMemorySyncHash,
} from "./supermemory";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Supermemory sync failed";
}

export async function syncPersistedBrandReferenceMemory(
  input: SyncPersistedBrandReferenceMemoryInput
): Promise<BrandReferenceMemorySyncResult> {
  try {
    const [reference] = await db
      .select()
      .from(brandReferences)
      .where(
        and(
          eq(brandReferences.id, input.referenceId),
          eq(brandReferences.brandSettingsId, input.voiceId)
        )
      )
      .limit(1);

    if (!reference) {
      throw new Error("Brand reference no longer exists");
    }

    const payload = buildBrandReferenceMemoryPayload({
      organizationId: input.organizationId,
      reference,
      voiceId: input.voiceId,
    });
    const syncHash = getBrandReferenceMemorySyncHash(payload);
    const link = await createBrandReferenceMemory(payload);

    if (!(link.documentId || link.memoryId)) {
      throw new Error("Supermemory did not return a reference memory ID");
    }

    return await db.transaction(async (tx) => {
      const [currentReference] = await tx
        .select()
        .from(brandReferences)
        .where(
          and(
            eq(brandReferences.id, input.referenceId),
            eq(brandReferences.brandSettingsId, input.voiceId)
          )
        )
        .limit(1)
        .for("update");

      if (!currentReference) {
        throw new Error("Brand reference no longer exists");
      }

      const currentSyncHash = getBrandReferenceMemorySyncHash(
        buildBrandReferenceMemoryPayload({
          organizationId: input.organizationId,
          reference: currentReference,
          voiceId: input.voiceId,
        })
      );
      if (currentSyncHash !== syncHash) {
        throw new Error("Brand reference changed while memory was syncing");
      }

      const [updated] = await tx
        .update(brandReferences)
        .set({
          supermemoryDocumentId: link.documentId,
          supermemoryLastSyncError: null,
          supermemoryMemoryId: link.memoryId,
          supermemorySyncedAt: new Date(),
        })
        .where(
          and(
            eq(brandReferences.id, input.referenceId),
            eq(brandReferences.brandSettingsId, input.voiceId)
          )
        )
        .returning({ id: brandReferences.id });

      if (!updated) {
        throw new Error("Brand reference no longer exists");
      }

      return {
        documentId: link.documentId,
        memoryId: link.memoryId,
        referenceId: input.referenceId,
        status: "synced",
      } satisfies BrandReferenceMemorySyncResult;
    });
  } catch (error) {
    const syncError = getErrorMessage(error);

    try {
      await db
        .update(brandReferences)
        .set({ supermemoryLastSyncError: syncError })
        .where(
          and(
            eq(brandReferences.id, input.referenceId),
            eq(brandReferences.brandSettingsId, input.voiceId)
          )
        );
    } catch (persistenceError) {
      return {
        error: `${syncError}; failed to persist sync error: ${getErrorMessage(persistenceError)}`,
        referenceId: input.referenceId,
        status: "failed",
      };
    }

    return {
      error: syncError,
      referenceId: input.referenceId,
      status: "failed",
    };
  }
}
