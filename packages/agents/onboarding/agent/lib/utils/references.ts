import { randomUUID } from "node:crypto";
import { db } from "@notra/db/drizzle";
import { brandReferences, brandSettings } from "@notra/db/schema";
import { desc, eq } from "drizzle-orm";
import type { ReferenceInput } from "../types/references";

function referenceKey(reference: Pick<ReferenceInput, "content" | "type">) {
  return `${reference.type}\u0000${reference.content}`;
}

export async function addBrandReferences(
  organizationId: string,
  references: ReferenceInput[]
) {
  return db.transaction(async (tx) => {
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
        content: brandReferences.content,
        type: brandReferences.type,
      })
      .from(brandReferences)
      .where(eq(brandReferences.brandSettingsId, settings.id));
    const knownKeys = new Set(existing.map(referenceKey));
    const uniqueReferences = new Map<string, ReferenceInput>();
    for (const reference of references) {
      const key = referenceKey(reference);
      if (!knownKeys.has(key)) {
        uniqueReferences.set(key, reference);
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
        ? await tx
            .insert(brandReferences)
            .values(values)
            .returning({ id: brandReferences.id, type: brandReferences.type })
        : [];

    return {
      brandSettingsId: settings.id,
      inserted,
      insertedCount: inserted.length,
      skippedCount: references.length - inserted.length,
    };
  });
}
