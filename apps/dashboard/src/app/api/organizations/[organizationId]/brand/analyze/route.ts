import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { workflowClient } from "@/lib/qstash";
import { getAppUrl } from "@/lib/triggers/qstash";
import { analyzeBrandSchema } from "@/schemas/brand";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();
    const validationResult = analyzeBrandSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { url } = validationResult.data;

    const appUrl = getAppUrl();

    await workflowClient.trigger({
      url: `${appUrl}/api/workflows/brand-analysis`,
      body: { organizationId, url },
    });

    return NextResponse.json({
      success: true,
      message: "Brand analysis started",
    });
  } catch (error) {
    console.error("Error starting brand analysis:", error);
    return NextResponse.json(
      { error: "Failed to start brand analysis" },
      { status: 500 }
    );
  }
}
