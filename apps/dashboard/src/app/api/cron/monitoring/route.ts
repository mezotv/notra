import { flushLogs } from "@notra/ai/evlog";
import { Clock, Effect } from "effect";
import { getWorld } from "workflow/runtime";

import { WORKFLOW_MONITORING } from "@/constants/workflow-monitoring";
import { checkBackendHealth } from "@/lib/analytics/backend-health";
import { collectWorkflowMonitoring } from "@/lib/analytics/workflow-monitoring";
import { readMonitoringOperation } from "@/utils/monitoring-operation";
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
  const sweepId = crypto.randomUUID();
  try {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const startedAt = yield* Clock.currentTimeMillis;
        yield* checkBackendHealth();
        const remainingMs =
          WORKFLOW_MONITORING.sweepBudgetMs -
          ((yield* Clock.currentTimeMillis) - startedAt);
        const world = yield* readMonitoringOperation(
          {
            operation: "workflow.world",
            sweepId,
            timeoutMs: Math.max(
              0,
              Math.min(WORKFLOW_MONITORING.operationTimeoutMs, remainingMs)
            ),
          },
          async () => getWorld()
        );
        return yield* collectWorkflowMonitoring(
          world,
          WORKFLOW_MONITORING.sweepBudgetMs -
            ((yield* Clock.currentTimeMillis) - startedAt),
          sweepId
        );
      })
    );
    return Response.json(result);
  } catch (error) {
    logWorkflowTelemetry({
      event: "monitoring.sweep.completed",
      sweepId,
      outcome: "error",
      errors: 1,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json({ error: "Monitoring sweep failed" }, { status: 500 });
  } finally {
    scheduleRequestErrorTelemetry(flushLogs);
  }
}
