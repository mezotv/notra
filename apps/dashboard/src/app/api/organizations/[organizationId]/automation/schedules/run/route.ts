import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import {
  ManualTriggerRunError,
  triggerManualAutomationRun,
} from "@/lib/triggers/manual-run";
import { triggerIdQuerySchema } from "@/schemas/api-params";

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

    const { searchParams } = new URL(request.url);
    const queryResult = triggerIdQuerySchema.safeParse({
      triggerId: searchParams.get("triggerId"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { triggerId } = queryResult.data;

    const { workflowRunId } = await triggerManualAutomationRun({
      organizationId,
      triggerId,
      triggeredBy: auth.context.user.id,
    });

    return NextResponse.json({
      success: true,
      workflowRunId,
      message: "Schedule triggered successfully",
    });
  } catch (error) {
    if (error instanceof ManualTriggerRunError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Error triggering schedule:", error);
    return NextResponse.json(
      { error: "Failed to trigger schedule" },
      { status: 500 }
    );
  }
}
