import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { updateBrandSettingsSchema } from "@/schemas/brand";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const voices = await db.query.brandSettings.findMany({
      where: eq(brandSettings.organizationId, organizationId),
      orderBy: [desc(brandSettings.isDefault), asc(brandSettings.createdAt)],
    });

    return NextResponse.json({ voices });
  } catch (error) {
    console.error("Error fetching brand settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();
    const validationResult = updateBrandSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { id, ...data } = validationResult.data;

    if (id) {
      const existing = await db.query.brandSettings.findFirst({
        where: and(
          eq(brandSettings.id, id),
          eq(brandSettings.organizationId, organizationId)
        ),
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Brand voice not found" },
          { status: 404 }
        );
      }

      await db
        .update(brandSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(brandSettings.id, id));
    } else {
      const existing = await db.query.brandSettings.findFirst({
        where: and(
          eq(brandSettings.organizationId, organizationId),
          eq(brandSettings.isDefault, true)
        ),
      });

      if (existing) {
        await db
          .update(brandSettings)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(brandSettings.id, existing.id));
      } else {
        if (!data.websiteUrl) {
          return NextResponse.json(
            { error: "Website URL is required to create default voice" },
            { status: 400 }
          );
        }

        await db.insert(brandSettings).values({
          id: crypto.randomUUID(),
          organizationId,
          websiteUrl: data.websiteUrl,
          ...data,
        });
      }
    }

    const voices = await db.query.brandSettings.findMany({
      where: eq(brandSettings.organizationId, organizationId),
      orderBy: [desc(brandSettings.isDefault), asc(brandSettings.createdAt)],
    });

    return NextResponse.json({ voices });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "A brand voice with this name already exists" },
        { status: 409 }
      );
    }

    console.error("Error updating brand settings:", error);
    return NextResponse.json(
      { error: "Failed to update brand settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();
    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : "Untitled Brand Voice";

    const rawUrl =
      typeof body.websiteUrl === "string" ? body.websiteUrl.trim() : "";
    if (!rawUrl) {
      return NextResponse.json(
        { error: "Website URL is required" },
        { status: 400 }
      );
    }
    const websiteUrl = rawUrl.startsWith("https://")
      ? rawUrl
      : `https://${rawUrl}`;

    const parseResult = z.url().safeParse(websiteUrl);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid website URL" },
        { status: 400 }
      );
    }

    const existingVoice = await db.query.brandSettings.findFirst({
      where: and(
        eq(brandSettings.organizationId, organizationId),
        eq(brandSettings.name, name)
      ),
    });
    if (existingVoice) {
      return NextResponse.json(
        { error: "A brand voice with this name already exists" },
        { status: 409 }
      );
    }

    const hasAnyVoice = await db.query.brandSettings.findFirst({
      where: eq(brandSettings.organizationId, organizationId),
      columns: { id: true },
    });
    const isDefault = !hasAnyVoice;

    const voice = await db
      .insert(brandSettings)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        name,
        isDefault,
        websiteUrl,
      })
      .returning();

    return NextResponse.json({ voice: voice[0] }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "A brand voice with this name already exists" },
        { status: 409 }
      );
    }

    console.error("Error creating brand voice:", error);
    return NextResponse.json(
      { error: "Failed to create brand voice" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const voiceId = searchParams.get("id");

    if (!voiceId) {
      return NextResponse.json(
        { error: "Voice ID is required" },
        { status: 400 }
      );
    }

    const voice = await db.query.brandSettings.findFirst({
      where: and(
        eq(brandSettings.id, voiceId),
        eq(brandSettings.organizationId, organizationId)
      ),
    });

    if (!voice) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    if (voice.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default voice" },
        { status: 400 }
      );
    }

    await db.delete(brandSettings).where(eq(brandSettings.id, voiceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand voice:", error);
    return NextResponse.json(
      { error: "Failed to delete brand voice" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();
    const voiceId = body.id;

    if (!voiceId || typeof voiceId !== "string") {
      return NextResponse.json(
        { error: "Voice ID is required" },
        { status: 400 }
      );
    }

    const voice = await db.query.brandSettings.findFirst({
      where: and(
        eq(brandSettings.id, voiceId),
        eq(brandSettings.organizationId, organizationId)
      ),
    });

    if (!voice) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(brandSettings)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(brandSettings.organizationId, organizationId),
            eq(brandSettings.isDefault, true)
          )
        );

      await tx
        .update(brandSettings)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(brandSettings.id, voiceId));
    });

    const voices = await db.query.brandSettings.findMany({
      where: eq(brandSettings.organizationId, organizationId),
      orderBy: [desc(brandSettings.isDefault), asc(brandSettings.createdAt)],
    });

    return NextResponse.json({ voices });
  } catch (error) {
    console.error("Error setting default voice:", error);
    return NextResponse.json(
      { error: "Failed to set default voice" },
      { status: 500 }
    );
  }
}
