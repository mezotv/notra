import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { listWebhookLogs } from "@/lib/webhooks/logging";
import { webhookLogsQuerySchema } from "@/schemas/api-params";
import type { Log, LogsResponse } from "@/types/lib/webhooks/webhooks";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

function paginateLogs(logs: Log[], page: number, pageSize: number) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return logs.slice(startIndex, endIndex);
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const queryResult = webhookLogsQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      integrationType: searchParams.get("integrationType") ?? undefined,
      integrationId: searchParams.get("integrationId"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, pageSize, integrationType, integrationId } = queryResult.data;

    const logs = await listWebhookLogs(
      organizationId,
      integrationType,
      integrationId === "all" ? null : (integrationId ?? null)
    );

    const paginatedLogs = paginateLogs(logs, page, pageSize);

    const response: LogsResponse = {
      logs: paginatedLogs,
      pagination: {
        page,
        pageSize,
        totalCount: logs.length,
        totalPages: Math.max(1, Math.ceil(logs.length / pageSize)),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching webhook logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
