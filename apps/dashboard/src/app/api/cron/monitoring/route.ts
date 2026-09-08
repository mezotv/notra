import { flushLogs } from "@notra/ai/evlog";
import { getWorld } from "workflow/runtime";

import { checkBackendHealth } from "@/lib/analytics/backend-health";
import { collectWorkflowMonitoring } from "@/lib/analytics/workflow-monitoring";
import { withMonitoringTimeout } from "@/utils/monitoring-timeout";
import { scheduleRequestErrorTelemetry } from "@/utils/request-error-telemetry";
import { logWorkflowTelemetry } from "@/utils/workflow-telemetry";

export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!process.env.AXIOM_TOKEN || !process.env.AXIOM_AI_DATASET) {
    return Response.json({ skipped: "telemetry_not_configured" });
  }
  try {
    await checkBackendHealth();
    const world = await withMonitoringTimeout(Promise.resolve(getWorld()));
    const result = await collectWorkflowMonitoring(world);
    return Response.json(result);
  } catch (error) {
    logWorkflowTelemetry({
      event: "monitoring.sweep.completed",
      sweepId: crypto.randomUUID(),
      outcome: "error",
      errors: 1,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json({ error: "Monitoring sweep failed" }, { status: 500 });
  } finally {
    scheduleRequestErrorTelemetry(flushLogs);
  }
}
