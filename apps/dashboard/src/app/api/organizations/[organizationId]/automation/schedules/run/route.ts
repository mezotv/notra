import { db } from "@notra/db/drizzle";
import { contentTriggers } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { checkLogRetention } from "@/lib/billing/check-log-retention";
import { triggerScheduleNow } from "@/lib/triggers/qstash";
import { appendWebhookLog } from "@/lib/webhooks/logging";
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

    const trigger = await db.query.contentTriggers.findFirst({
      where: and(
        eq(contentTriggers.id, triggerId),
        eq(contentTriggers.organizationId, organizationId)
      ),
    });

    if (!trigger) {
      return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    }

    if (!trigger.enabled) {
      return NextResponse.json(
        { error: "Cannot run a disabled schedule" },
        { status: 400 }
      );
    }

    const workflowRunId = await triggerScheduleNow(triggerId, { manual: true });
    const logRetentionDays = await checkLogRetention(organizationId);

    const scheduleName = trigger.name.trim() || trigger.outputType;

    await appendWebhookLog({
      organizationId,
      integrationId: triggerId,
      integrationType: "manual",
      title: scheduleName,
      status: "success",
      statusCode: 200,
      referenceId: workflowRunId,
      payload: {
        triggerId,
        scheduleName,
        sourceType: trigger.sourceType,
        outputType: trigger.outputType,
        workflowRunId,
        triggeredBy: auth.context.user.id,
      },
      retentionDays: logRetentionDays,
    });

    return NextResponse.json({
      success: true,
      workflowRunId,
      message: "Schedule triggered successfully",
    });
  } catch (error) {
    console.error("Error triggering schedule:", error);
    return NextResponse.json(
      { error: "Failed to trigger schedule" },
      { status: 500 }
    );
  }
}
