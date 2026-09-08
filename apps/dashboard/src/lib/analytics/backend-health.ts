import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { sql } from "drizzle-orm";

import { withMonitoringTimeout } from "@/utils/monitoring-timeout";
import { logWorkflowTelemetry } from "@/utils/workflow-telemetry";

async function checkDependency(
  dependency: string,
  check: () => Promise<unknown>
): Promise<void> {
  const startedAt = performance.now();
  try {
    await withMonitoringTimeout(check());
    logWorkflowTelemetry({
      event: "backend.dependency.checked",
      dependency,
      outcome: "success",
      durationMs: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    logWorkflowTelemetry({
      event: "backend.dependency.checked",
      dependency,
      outcome: "error",
      errorName: error instanceof Error ? error.name : "UnknownError",
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}

export async function checkBackendHealth(): Promise<void> {
  const client = redis;
  await Promise.all([
    checkDependency("postgres", async () => db.execute(sql`select 1`)),
    ...(client ? [checkDependency("redis", () => client.ping())] : []),
  ]);
}
