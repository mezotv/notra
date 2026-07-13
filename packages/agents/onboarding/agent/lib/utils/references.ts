import { randomUUID } from "node:crypto";
import { db } from "@notra/db/drizzle";
import { brandReferences, brandSettings } from "@notra/db/schema";
import type { BrandReferenceMemorySyncResult } from "@notra/db/types/brand-reference-memory";
import { syncPersistedBrandReferenceMemory } from "@notra/db/utils/brand-reference-memory";
import { canonicalizeReferenceSourceUrl } from "@notra/db/utils/reference-source-url";
import { desc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { REFERENCE_MEMORY_SYNC_CONCURRENCY } from "../constants/supermemory";
import type { ReferenceInput } from "../types/references";

function referenceKey(reference: Pick<ReferenceInput, "content" | "type">) {
  return `${reference.type}\u0000${reference.content}`;
}

function getCanonicalSourceUrl(sourceUrl: string | null | undefined) {
  if (!sourceUrl) {
    return null;
  }
  try {
    return canonicalizeReferenceSourceUrl(sourceUrl);
  } catch {
    return sourceUrl.trim();
  }
}

export async function addBrandReferences(
  organizationId: string,
  references: ReferenceInput[]
) {
  const persistence = await db.transaction(async (tx) => {
    const [settings] = await tx
      .select({ id: brandSettings.id })
      .from(brandSettings)
      .where(eq(brandSettings.organizationId, organizationId))
      .orderBy(desc(brandSettings.isDefault))
      .limit(1)
      .for("update");
    if (!settings) {
      throw new Error(
        "No brand settings exist for this organization; cannot add references"
      );
    }

    const existing = await tx
      .select({
        applicableTo: brandReferences.applicableTo,
        content: brandReferences.content,
        id: brandReferences.id,
        metadata: brandReferences.metadata,
        note: brandReferences.note,
        sourceUrl: brandReferences.sourceUrl,
        supermemorySyncedAt: brandReferences.supermemorySyncedAt,
        type: brandReferences.type,
      })
      .from(brandReferences)
      .where(eq(brandReferences.brandSettingsId, settings.id));
    const existingByKey = new Map(
      existing.map((reference) => [referenceKey(reference), reference])
    );
    const existingBySourceUrl = new Map<string, (typeof existing)[number]>();
    for (const reference of existing) {
      const sourceUrl = getCanonicalSourceUrl(reference.sourceUrl);
      if (sourceUrl) {
        existingBySourceUrl.set(sourceUrl, reference);
      }
    }
    const uniqueReferences = new Map<string, ReferenceInput>();
    const uniqueSourceUrls = new Set<string>();
    const referencesToRepair = new Map<string, (typeof existing)[number]>();
    for (const reference of references) {
      const key = referenceKey(reference);
      const sourceUrl = getCanonicalSourceUrl(reference.sourceUrl);
      const existingSourceReference = sourceUrl
        ? existingBySourceUrl.get(sourceUrl)
        : undefined;
      const existingContentReference = existingByKey.get(key);
      const existingReference =
        existingSourceReference ?? existingContentReference;
      if (existingReference) {
        if (existingReference.supermemorySyncedAt === null) {
          referencesToRepair.set(existingReference.id, existingReference);
        }
        continue;
      }
      if (
        uniqueReferences.has(key) ||
        (sourceUrl ? uniqueSourceUrls.has(sourceUrl) : false)
      ) {
        continue;
      }
      uniqueReferences.set(key, {
        ...reference,
        sourceUrl: sourceUrl ?? undefined,
      });
      if (sourceUrl) {
        uniqueSourceUrls.add(sourceUrl);
      }
    }

    const values = [...uniqueReferences.values()].map((reference) => ({
      applicableTo: reference.applicableTo,
      brandSettingsId: settings.id,
      content: reference.content,
      id: randomUUID(),
      metadata: {
        source: "onboarding-agent",
      },
      note: reference.note ?? null,
      sourceCapturedAt: reference.sourceCapturedAt
        ? new Date(reference.sourceCapturedAt)
        : null,
      sourceContentHash: reference.sourceContentHash ?? null,
      sourceSnapshotKey: reference.sourceSnapshotKey ?? null,
      sourceUrl: reference.sourceUrl ?? null,
      type: reference.type,
    }));
    const inserted =
      values.length > 0
        ? await tx.insert(brandReferences).values(values).returning()
        : [];

    return {
      brandSettingsId: settings.id,
      inserted,
      insertedCount: inserted.length,
      referencesToSync: [...inserted, ...referencesToRepair.values()],
      skippedCount: references.length - inserted.length,
    };
  });

  const uniqueReferencesToSync = new Map(
    persistence.referencesToSync.map((reference) => [reference.id, reference])
  );
  const syncResults: BrandReferenceMemorySyncResult[] = await Effect.runPromise(
    Effect.all(
      [...uniqueReferencesToSync.values()].map((reference) =>
        Effect.promise(() =>
          syncPersistedBrandReferenceMemory({
            organizationId,
            referenceId: reference.id,
            voiceId: persistence.brandSettingsId,
          })
        )
      ),
      { concurrency: REFERENCE_MEMORY_SYNC_CONCURRENCY }
    )
  );

  const failures = syncResults.filter((result) => result.status === "failed");
  const synced = syncResults.filter((result) => result.status === "synced");
  const insertedIds = new Set(
    persistence.inserted.map((reference) => reference.id)
  );
  return {
    brandSettingsId: persistence.brandSettingsId,
    failures,
    inserted: persistence.inserted.map((reference) => ({
      id: reference.id,
      type: reference.type,
    })),
    insertedCount: persistence.insertedCount,
    repairedCount: synced.filter(
      (result) => !insertedIds.has(result.referenceId)
    ).length,
    skippedCount: persistence.skippedCount,
    status: failures.length > 0 ? "partial" : "complete",
    syncFailedCount: failures.length,
    syncedCount: synced.length,
  };
}
