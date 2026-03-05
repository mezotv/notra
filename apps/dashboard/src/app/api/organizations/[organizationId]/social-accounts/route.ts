import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";

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

    const accounts = await db.query.connectedSocialAccounts.findMany({
      where: eq(connectedSocialAccounts.organizationId, organizationId),
      columns: {
        id: true,
        provider: true,
        providerAccountId: true,
        username: true,
        displayName: true,
        profileImageUrl: true,
        verified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching connected accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch connected accounts" },
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
    const accountId = searchParams.get("id");
    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const existing = await db.query.connectedSocialAccounts.findFirst({
      where: and(
        eq(connectedSocialAccounts.id, accountId),
        eq(connectedSocialAccounts.organizationId, organizationId)
      ),
      columns: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await db
      .delete(connectedSocialAccounts)
      .where(eq(connectedSocialAccounts.id, accountId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting connected account:", error);
    return NextResponse.json(
      { error: "Failed to delete connected account" },
      { status: 500 }
    );
  }
}
