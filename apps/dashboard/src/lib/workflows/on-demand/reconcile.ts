import { db } from "@notra/db/drizzle";
import { postCollections, posts } from "@notra/db/schema";
import { and, count, eq } from "drizzle-orm";

export async function reconcileUnsuccessfulPostCollectionAttempt(params: {
  collectionId: string;
  organizationId: string;
  runId: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    const [collection] = await tx
      .select({
        completedPostCount: postCollections.completedPostCount,
        expectedPostCount: postCollections.expectedPostCount,
        sourceMetadata: postCollections.sourceMetadata,
      })
      .from(postCollections)
      .where(
        and(
          eq(postCollections.id, params.collectionId),
          eq(postCollections.organizationId, params.organizationId)
        )
      )
      .for("update");

    if (!collection) {
      return;
    }

    const sourceMetadata: Record<string, unknown> =
      collection.sourceMetadata &&
      typeof collection.sourceMetadata === "object" &&
      !Array.isArray(collection.sourceMetadata)
        ? Object.fromEntries(Object.entries(collection.sourceMetadata))
        : {};
    const reconciledRunIds = Array.isArray(
      sourceMetadata.reconciledUnsuccessfulRunIds
    )
      ? sourceMetadata.reconciledUnsuccessfulRunIds.filter(
          (value): value is string => typeof value === "string"
        )
      : [];

    if (reconciledRunIds.includes(params.runId)) {
      return;
    }

    const [postCountResult] = await tx
      .select({ value: count() })
      .from(posts)
      .where(
        and(
          eq(posts.collectionId, params.collectionId),
          eq(posts.organizationId, params.organizationId)
        )
      );

    const successfulPostCount = Math.max(
      collection.completedPostCount,
      postCountResult?.value ?? 0
    );
    const expectedAttempts = collection.expectedPostCount ?? 1;

    if (successfulPostCount === 0 && expectedAttempts <= 1) {
      await tx
        .delete(postCollections)
        .where(
          and(
            eq(postCollections.id, params.collectionId),
            eq(postCollections.organizationId, params.organizationId)
          )
        );
      return;
    }

    if (collection.expectedPostCount !== null) {
      await tx
        .update(postCollections)
        .set({
          expectedPostCount: Math.max(
            successfulPostCount,
            collection.expectedPostCount - 1
          ),
          sourceMetadata: {
            ...sourceMetadata,
            reconciledUnsuccessfulRunIds: [...reconciledRunIds, params.runId],
          },
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(postCollections.id, params.collectionId),
            eq(postCollections.organizationId, params.organizationId)
          )
        );
    }
  });
}
