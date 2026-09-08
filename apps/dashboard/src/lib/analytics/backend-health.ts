import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { sql } from "drizzle-orm";
import { Effect } from "effect";

import { WORKFLOW_MONITORING } from "@/constants/workflow-monitoring";
import { logWorkflowTelemetry } from "@/utils/workflow-telemetry";

const checkDependency = Effect.fn("monitoring.checkDependency")(function* (
  dependency: string,
  check: () => Promise<unknown>
) {
  const startedAt = performance.now();
  yield* Effect.tryPromise({ try: check, catch: (error) => error }).pipe(
    Effect.timeout(WORKFLOW_MONITORING.operationTimeoutMs),
    Effect.match({
      onSuccess: () =>
        logWorkflowTelemetry({
          event: "backend.dependency.checked",
          dependency,
          outcome: "success",
          durationMs: Math.round(performance.now() - startedAt),
        }),
      onFailure: (error) =>
        logWorkflowTelemetry({
          event: "backend.dependency.checked",
          dependency,
          outcome: "error",
          errorName: error instanceof Error ? error.name : "UnknownError",
          durationMs: Math.round(performance.now() - startedAt),
        }),
    })
  );
});

export const checkBackendHealth = Effect.fn("monitoring.checkBackendHealth")(
  function* () {
    const client = redis;
    yield* Effect.all(
      [
        checkDependency("postgres", async () => db.execute(sql`select 1`)),
        ...(client ? [checkDependency("redis", () => client.ping())] : []),
      ],
      { concurrency: "unbounded", discard: true }
    );
  }
);
