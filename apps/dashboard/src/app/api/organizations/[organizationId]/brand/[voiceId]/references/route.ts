import { db } from "@notra/db/drizzle";
import { brandReferences, brandSettings } from "@notra/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { FEATURES } from "@/constants/features";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { autumn } from "@/lib/billing/autumn";
import { createReferenceSchema, updateReferenceSchema } from "@/schemas/brand";
import type { ApplicablePlatform } from "@/types/hooks/brand-references";

interface RouteContext {
  params: Promise<{ organizationId: string; voiceId: string }>;
}

async function verifyVoiceOwnership(organizationId: string, voiceId: string) {
  return db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.id, voiceId),
      eq(brandSettings.organizationId, organizationId)
    ),
    columns: { id: true },
  });
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

    const typeDefaults: Record<string, ApplicablePlatform[]> = {
      twitter_post: ["twitter"],
      linkedin_post: ["linkedin"],
      blog_post: ["blog"],
    };

    const applicableTo: ApplicablePlatform[] = result.data.applicableTo ??
      typeDefaults[result.data.type] ?? ["all"];

    if (autumn) {
      const { data, error } = await autumn.check({
        customer_id: organizationId,
        feature_id: FEATURES.REFERENCES,
        required_balance: 1,
        send_event: true,
      });
      if (error || !data?.allowed) {
        return NextResponse.json(
          { error: "Reference limit reached. Upgrade your plan to add more." },
          { status: 403 }
        );
      }
    }

    const reference = await db
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

    return NextResponse.json({ reference: reference[0] }, { status: 201 });
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

    const existing = await db.query.brandReferences.findFirst({
      where: and(
        eq(brandReferences.id, referenceId),
        eq(brandReferences.brandSettingsId, voiceId)
      ),
    });

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

    return NextResponse.json({ reference: updated[0] });
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

    const existing = await db.query.brandReferences.findFirst({
      where: and(
        eq(brandReferences.id, referenceId),
        eq(brandReferences.brandSettingsId, voiceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 }
      );
    }

    await db.delete(brandReferences).where(eq(brandReferences.id, referenceId));

    if (autumn) {
      await autumn.track({
        customer_id: organizationId,
        feature_id: FEATURES.REFERENCES,
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
