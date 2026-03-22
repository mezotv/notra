import { eq, isNull, or } from "drizzle-orm";
import { db } from "../src/drizzle";
import { brandReferences, brandSettings } from "../src/schema";
import {
  buildBrandReferenceMemoryPayload,
  createBrandReferenceMemory,
  deleteBrandReferenceMemory,
} from "../src/utils/supermemory";

async function backfill() {
  console.log("[backfill] Starting reference memory backfill...");

  const rows = await db
    .select({
      id: brandReferences.id,
      brandSettingsId: brandReferences.brandSettingsId,
      type: brandReferences.type,
      content: brandReferences.content,
      metadata: brandReferences.metadata,
      note: brandReferences.note,
      applicableTo: brandReferences.applicableTo,
      supermemoryDocumentId: brandReferences.supermemoryDocumentId,
      supermemoryMemoryId: brandReferences.supermemoryMemoryId,
      organizationId: brandSettings.organizationId,
    })
    .from(brandReferences)
    .innerJoin(
      brandSettings,
      eq(brandSettings.id, brandReferences.brandSettingsId)
    )
    .where(
      or(
        isNull(brandReferences.supermemoryDocumentId),
        isNull(brandReferences.supermemoryMemoryId)
      )
    );

  if (rows.length === 0) {
    console.log("[backfill] No references need backfill.");
    process.exit(0);
  }

  console.log(`[backfill] Found ${rows.length} references to backfill`);

  let synced = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      if (row.supermemoryDocumentId) {
        await deleteBrandReferenceMemory({
          documentId: row.supermemoryDocumentId,
        });
      }

      const payload = buildBrandReferenceMemoryPayload({
        organizationId: row.organizationId,
        voiceId: row.brandSettingsId,
        reference: {
          id: row.id,
          type: row.type,
          content: row.content,
          note: row.note,
          applicableTo: row.applicableTo,
          metadata: row.metadata as Record<string, unknown> | null,
        },
      });
      const link = await createBrandReferenceMemory(payload);

      await db
        .update(brandReferences)
        .set({
          supermemoryDocumentId: link.documentId,
          supermemoryMemoryId: link.memoryId,
          supermemorySyncedAt: new Date(),
          supermemoryLastSyncError: null,
          updatedAt: new Date(),
        })
        .where(eq(brandReferences.id, row.id));

      synced += 1;
      console.log(`[backfill] Synced ${row.id}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[backfill] Failed ${row.id}: ${message}`);
      await db
        .update(brandReferences)
        .set({
          supermemoryLastSyncError: message,
          updatedAt: new Date(),
        })
        .where(eq(brandReferences.id, row.id));
    }
  }

  console.log(`[backfill] Done. synced=${synced} failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

backfill().catch((error) => {
  console.error("[backfill] FATAL:", error);
  process.exit(1);
});
