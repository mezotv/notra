import { db } from "@notra/db/drizzle";
import { brandReferences, brandSettings } from "@notra/db/schema";
import { deleteBrandReferenceMemory } from "@notra/db/utils/supermemory";
import { and, desc, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { FEATURES } from "@/constants/features";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { autumn } from "@/lib/billing/autumn";
import { createReferenceSchema, updateReferenceSchema } from "@/schemas/brand";
import type { ApplicablePlatform } from "@/types/hooks/brand-references";
import {
  type ReferenceMemoryRecord,
  removeBrandReferenceMemory,
  syncBrandReferenceMemory,
} from "@/utils/brand-reference-memory";

interface RouteContext {
  params: Promise<{ organizationId: string; voiceId: string }>;
}

const typeDefaults: Record<string, ApplicablePlatform[]> = {
  twitter_post: ["twitter"],
  linkedin_post: ["linkedin"],
  blog_post: ["blog"],
};

async function verifyVoiceOwnership(organizationId: string, voiceId: string) {
  return db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.id, voiceId),
      eq(brandSettings.organizationId, organizationId)
    ),
    columns: { id: true },
  });
}

async function getReferenceById(referenceId: string, voiceId: string) {
  return db.query.brandReferences.findFirst({
    where: and(
      eq(brandReferences.id, referenceId),
      eq(brandReferences.brandSettingsId, voiceId)
    ),
  });
}

function isMemorySyncFieldUpdate(data: {
  content?: string;
  note?: string | null;
  applicableTo?: string[];
}) {
  return (
    Object.hasOwn(data, "content") ||
    Object.hasOwn(data, "note") ||
    Object.hasOwn(data, "applicableTo")
  );
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, voiceId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);
    if (!auth.success) {
      return auth.response;
    }

    const voice = await verifyVoiceOwnership(organizationId, voiceId);
    if (!voice) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    const references = await db.query.brandReferences.findMany({
      where: eq(brandReferences.brandSettingsId, voiceId),
      orderBy: [desc(brandReferences.createdAt)],
    });

    return NextResponse.json({ references });
  } catch (error) {
    console.error("Error fetching references:", error);
    return NextResponse.json(
      { error: "Failed to fetch references" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, voiceId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);
    if (!auth.success) {
      return auth.response;
    }

    const voice = await verifyVoiceOwnership(organizationId, voiceId);
    if (!voice) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = createReferenceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    const metadata = result.data.metadata ?? null;
    const tweetId = (metadata as Record<string, unknown> | null)?.tweetId;

    if (tweetId) {
      const existing = await db.query.brandReferences.findFirst({
        where: and(
          eq(brandReferences.brandSettingsId, voiceId),
          sql`${brandReferences.metadata}->>'tweetId' = ${String(tweetId)}`
        ),
        columns: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          { error: "This tweet has already been added as a reference" },
          { status: 409 }
        );
      }
    }

    const applicableTo: ApplicablePlatform[] = result.data.applicableTo ??
      typeDefaults[result.data.type] ?? ["all"];

    if (autumn) {
      let data: { allowed?: boolean } | null = null;
      try {
        data = await autumn.check({
          customerId: organizationId,
          featureId: FEATURES.REFERENCES,
          requiredBalance: 1,
          sendEvent: true,
        });
      } catch {
        data = null;
      }

      if (!data?.allowed) {
        return NextResponse.json(
          { error: "Reference limit reached. Upgrade your plan to add more." },
          { status: 403 }
        );
      }
    }

    const inserted = await db
      .insert(brandReferences)
      .values({
        id: crypto.randomUUID(),
        brandSettingsId: voiceId,
        type: result.data.type,
        content: result.data.content,
        metadata,
        note: result.data.note ?? null,
        applicableTo,
      })
      .returning();

    const reference = inserted[0];

    if (!reference) {
      throw new Error("Reference was not created");
    }

    let createdDocumentId: string | null = null;

    try {
      const link = await syncBrandReferenceMemory({
        organizationId,
        voiceId,
        reference: reference as ReferenceMemoryRecord,
      });
      createdDocumentId = link.documentId;

      const synced = await db
        .update(brandReferences)
        .set({
          supermemoryDocumentId: link.documentId,
          supermemoryMemoryId: link.memoryId,
          supermemorySyncedAt: new Date(),
          supermemoryLastSyncError: null,
        })
        .where(eq(brandReferences.id, reference.id))
        .returning();

      return NextResponse.json({ reference: synced[0] }, { status: 201 });
    } catch (error) {
      await db
        .delete(brandReferences)
        .where(eq(brandReferences.id, reference.id));

      if (createdDocumentId) {
        try {
          await deleteBrandReferenceMemory({ documentId: createdDocumentId });
        } catch (cleanupError) {
          console.error(
            "Error cleaning up failed Supermemory reference:",
            cleanupError
          );
        }
      }

      if (autumn) {
        await autumn.track({
          customerId: organizationId,
          featureId: FEATURES.REFERENCES,
          value: -1,
        });
      }

      console.error("Error syncing reference to Supermemory:", error);
      return NextResponse.json(
        { error: "Failed to sync reference to memory" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating reference:", error);
    return NextResponse.json(
      { error: "Failed to create reference" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, voiceId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);
    if (!auth.success) {
      return auth.response;
    }

    const voice = await verifyVoiceOwnership(organizationId, voiceId);
    if (!voice) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const referenceId = searchParams.get("id");
    if (!referenceId) {
      return NextResponse.json(
        { error: "Reference ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = updateReferenceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    const existing = await getReferenceById(referenceId, voiceId);

    if (!existing) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 }
      );
    }

    const updated = await db
      .update(brandReferences)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(brandReferences.id, referenceId))
      .returning();

    const reference = updated[0];

    if (!reference) {
      throw new Error("Reference update failed");
    }

    if (!isMemorySyncFieldUpdate(result.data)) {
      return NextResponse.json({ reference });
    }

    let createdDocumentId: string | null = null;

    try {
      const link = await syncBrandReferenceMemory({
        organizationId,
        voiceId,
        reference: reference as ReferenceMemoryRecord,
      });
      createdDocumentId = link.documentId;

      await db
        .update(brandReferences)
        .set({
          supermemoryDocumentId: link.documentId,
          supermemoryMemoryId: link.memoryId,
          supermemorySyncedAt: new Date(),
          supermemoryLastSyncError: null,
        })
        .where(eq(brandReferences.id, referenceId));

      if (
        existing.supermemoryDocumentId &&
        existing.supermemoryDocumentId !== link.documentId
      ) {
        try {
          await removeBrandReferenceMemory(existing as ReferenceMemoryRecord);
        } catch (cleanupError) {
          console.error("Error deleting stale reference memory:", cleanupError);
          await db
            .update(brandReferences)
            .set({
              supermemoryLastSyncError:
                "Reference updated, but the previous Supermemory document could not be deleted.",
            })
            .where(eq(brandReferences.id, referenceId));
        }
      }

      const refreshedReference = await getReferenceById(referenceId, voiceId);

      if (!refreshedReference) {
        throw new Error("Reference update refresh failed");
      }

      return NextResponse.json({ reference: refreshedReference });
    } catch (error) {
      console.error("Error syncing updated reference to Supermemory:", error);

      if (createdDocumentId) {
        try {
          await deleteBrandReferenceMemory({ documentId: createdDocumentId });
        } catch (cleanupError) {
          console.error(
            "Error cleaning up failed updated Supermemory reference:",
            cleanupError
          );
        }
      }

      await db
        .update(brandReferences)
        .set({
          supermemoryLastSyncError:
            error instanceof Error ? error.message : "Supermemory sync failed",
        })
        .where(eq(brandReferences.id, referenceId));

      return NextResponse.json(
        { error: "Reference updated, but memory sync failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating reference:", error);
    return NextResponse.json(
      { error: "Failed to update reference" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, voiceId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);
    if (!auth.success) {
      return auth.response;
    }

    const voice = await verifyVoiceOwnership(organizationId, voiceId);
    if (!voice) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const referenceId = searchParams.get("id");
    if (!referenceId) {
      return NextResponse.json(
        { error: "Reference ID is required" },
        { status: 400 }
      );
    }

    const existing = await getReferenceById(referenceId, voiceId);

    if (!existing) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 }
      );
    }

    try {
      await removeBrandReferenceMemory(existing as ReferenceMemoryRecord);
    } catch (error) {
      console.error("Error deleting reference memory:", error);
    }

    await db.delete(brandReferences).where(eq(brandReferences.id, referenceId));

    if (autumn) {
      await autumn.track({
        customerId: organizationId,
        featureId: FEATURES.REFERENCES,
        value: -1,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reference:", error);
    return NextResponse.json(
      { error: "Failed to delete reference" },
      { status: 500 }
    );
  }
}
