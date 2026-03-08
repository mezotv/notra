import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import {
  clearCompletedGeneration,
  getActiveGenerations,
  getCompletedGenerations,
} from "@/lib/generations/tracking";
import { clearCompletedGenerationSchema } from "@/schemas/generations";

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

    const [generations, results] = await Promise.all([
      getActiveGenerations(organizationId),
      getCompletedGenerations(organizationId),
    ]);

    return NextResponse.json({ generations, results });
  } catch (error) {
    console.error("Error fetching active generations:", error);
    return NextResponse.json(
      { error: "Failed to fetch active generations" },
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

    const parseResult = clearCompletedGenerationSchema.safeParse(
      await request.json()
    );

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    await clearCompletedGeneration(organizationId, parseResult.data.runId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing completed generation:", error);
    return NextResponse.json(
      { error: "Failed to clear completed generation" },
      { status: 500 }
    );
  }
}
