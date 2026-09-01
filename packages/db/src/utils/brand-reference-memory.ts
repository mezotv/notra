import { and, eq, sql } from "drizzle-orm";

import { db } from "../drizzle";
import { brandReferences } from "../schema";
import type {
  BrandReferenceMemorySyncResult,
  SyncPersistedBrandReferenceMemoryInput,
} from "../types/brand-reference-memory";
import {
  buildBrandReferenceMemoryPayload,
  createBrandReferenceMemory,
  deleteBrandReferenceMemory,
  getBrandReferenceMemoryCustomId,
  getBrandReferenceMemorySyncHash,
} from "./supermemory";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Supermemory sync failed";
}

export async function syncPersistedBrandReferenceMemory(
  input: SyncPersistedBrandReferenceMemoryInput
): Promise<BrandReferenceMemorySyncResult> {
  let attemptedCustomId: string | null = null;
  let attemptedDocumentId: string | null = null;
  let attemptedSyncHash: string | null = null;

  try {
    return await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${`brand-reference-memory:${input.referenceId}`}, 0))`
      );

      const [reference] = await tx
        .select({
          id: brandReferences.id,
          type: brandReferences.type,
          content: brandReferences.content,
          note: brandReferences.note,
          applicableTo: brandReferences.applicableTo,
          metadata: brandReferences.metadata,
          sourceUrl: brandReferences.sourceUrl,
          rowVersion: sql<string>`xmin::text`,
        })
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
      attemptedCustomId = getBrandReferenceMemoryCustomId(payload);
      attemptedSyncHash = getBrandReferenceMemorySyncHash(payload);
      const link = await createBrandReferenceMemory(payload);
      attemptedDocumentId = link.documentId;

      if (!link.documentId) {
        throw new Error("Supermemory did not return a reference document ID");
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
            eq(brandReferences.brandSettingsId, input.voiceId),
            sql`xmin::text = ${reference.rowVersion}`
          )
        )
        .returning({ id: brandReferences.id });

      if (!updated) {
        throw new Error("Brand reference changed while memory was syncing");
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
    let failureError = syncError;
    let recoveredResult: BrandReferenceMemorySyncResult | null = null;

    try {
      await db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${`brand-reference-memory:${input.referenceId}`}, 0))`
        );

        const [currentReference] = await tx
          .select({
            id: brandReferences.id,
            type: brandReferences.type,
            content: brandReferences.content,
            note: brandReferences.note,
            applicableTo: brandReferences.applicableTo,
            metadata: brandReferences.metadata,
            sourceUrl: brandReferences.sourceUrl,
            supermemoryDocumentId: brandReferences.supermemoryDocumentId,
            supermemoryMemoryId: brandReferences.supermemoryMemoryId,
            rowVersion: sql<string>`xmin::text`,
          })
          .from(brandReferences)
          .where(
            and(
              eq(brandReferences.id, input.referenceId),
              eq(brandReferences.brandSettingsId, input.voiceId)
            )
          )
          .limit(1);

        const currentSyncHash = currentReference
          ? getBrandReferenceMemorySyncHash(
              buildBrandReferenceMemoryPayload({
                organizationId: input.organizationId,
                reference: currentReference,
                voiceId: input.voiceId,
              })
            )
          : null;
        const isAttemptedVersion =
          attemptedSyncHash !== null && currentSyncHash === attemptedSyncHash;
        const isPersisted =
          isAttemptedVersion &&
          currentReference !== undefined &&
          currentReference.supermemoryDocumentId !== null &&
          (attemptedDocumentId === null ||
            currentReference.supermemoryDocumentId === attemptedDocumentId);

        if (isPersisted && currentReference) {
          recoveredResult = {
            documentId: currentReference.supermemoryDocumentId,
            memoryId: currentReference.supermemoryMemoryId,
            referenceId: input.referenceId,
            status: "synced",
          };
          return;
        }

        const cleanupIdentifier = attemptedDocumentId ?? attemptedCustomId;
        const isReferencedDocument =
          attemptedDocumentId !== null &&
          currentReference?.supermemoryDocumentId === attemptedDocumentId;
        if (cleanupIdentifier && !isReferencedDocument) {
          try {
            await deleteBrandReferenceMemory({
              customId: attemptedCustomId,
              documentId: attemptedDocumentId,
            });
          } catch (cleanupError) {
            failureError = `${syncError}; failed to clean up Supermemory document: ${getErrorMessage(cleanupError)}`;
          }
        }

        if (currentReference && isAttemptedVersion) {
          await tx
            .update(brandReferences)
            .set({ supermemoryLastSyncError: failureError })
            .where(
              and(
                eq(brandReferences.id, input.referenceId),
                eq(brandReferences.brandSettingsId, input.voiceId),
                sql`xmin::text = ${currentReference.rowVersion}`
              )
            );
        }
      });
    } catch (persistenceError) {
      return {
        error: `${failureError}; failed to reconcile sync failure: ${getErrorMessage(persistenceError)}`,
        referenceId: input.referenceId,
        status: "failed",
      };
    }

    if (recoveredResult) {
      return recoveredResult;
    }

    return {
      error: failureError,
      referenceId: input.referenceId,
      status: "failed",
    };
  }
}
