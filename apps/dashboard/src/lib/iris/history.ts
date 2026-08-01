import { plannerOutputSchema } from "@notra/ai/schemas/autonomy/planner";
import { db } from "@notra/db/drizzle";
import { autonomyActions, autonomyRuns } from "@notra/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Effect } from "effect";
import {
  IRIS_OPEN_RUN_STATUSES,
  IRIS_RECENT_ACTION_LIMIT,
} from "@/constants/iris";
import { IrisRunStoreError } from "@/lib/iris/errors";

export const loadRecentActionSummaries = Effect.fn("iris.history.actions")(
  function* (organizationId: string) {
    const rows = yield* Effect.tryPromise({
      try: () =>
        db
          .select({
            capabilityName: autonomyActions.capabilityName,
            status: autonomyActions.status,
            createdAt: autonomyActions.createdAt,
          })
          .from(autonomyActions)
          .where(eq(autonomyActions.organizationId, organizationId))
          .orderBy(desc(autonomyActions.createdAt))
          .limit(IRIS_RECENT_ACTION_LIMIT),
      catch: (cause) =>
        new IrisRunStoreError({
          message: "Failed to load recent actions",
          cause,
        }),
    });

    return rows.map(
      (row) =>
        `${row.capabilityName} ${row.status} at ${row.createdAt.toISOString()}`
    );
  }
);

export const failOpenRun = Effect.fn("iris.history.failOpenRun")(
  function* (input: { organizationId: string; runId: string }) {
    const rows = yield* Effect.tryPromise({
      try: () =>
        db
          .update(autonomyRuns)
          .set({
            status: "failed",
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(autonomyRuns.id, input.runId),
              eq(autonomyRuns.organizationId, input.organizationId),
              inArray(autonomyRuns.status, [...IRIS_OPEN_RUN_STATUSES])
            )
          )
          .returning({ id: autonomyRuns.id }),
      catch: (cause) =>
        new IrisRunStoreError({
          message: "Failed to close the open run",
          cause,
        }),
    });

    if (rows.length > 0) {
      yield* Effect.annotateLogs(Effect.logWarning("iris.run.forceFailed"), {
        organizationId: input.organizationId,
        runId: input.runId,
      });
    }
  }
);

export const isRepeatedGateBlock = Effect.fn("iris.history.repeatedGateBlock")(
  function* (input: { organizationId: string; reason: string }) {
    const rows = yield* Effect.tryPromise({
      try: () =>
        db
          .select({
            id: autonomyRuns.id,
            status: autonomyRuns.status,
            plannerOutput: autonomyRuns.plannerOutput,
          })
          .from(autonomyRuns)
          .where(eq(autonomyRuns.organizationId, input.organizationId))
          .orderBy(desc(autonomyRuns.createdAt))
          .limit(1),
      catch: (cause) =>
        new IrisRunStoreError({
          message: "Failed to load the most recent run",
          cause,
        }),
    });

    const latest = rows.at(0);
    if (!latest || latest.status !== "completed") {
      return false;
    }

    const parsed = plannerOutputSchema.safeParse(latest.plannerOutput);
    if (!parsed.success) {
      return false;
    }

    const repeated =
      parsed.data.decision === "no_op" && parsed.data.reason === input.reason;

    if (repeated) {
      yield* Effect.annotateLogs(
        Effect.logInfo("iris.gate.repeatedNoOpSkipped"),
        {
          organizationId: input.organizationId,
          reason: input.reason,
          previousRunId: latest.id,
        }
      );
    }

    return repeated;
  }
);

export const hasOpenRun = Effect.fn("iris.history.hasOpenRun")(function* (
  organizationId: string
) {
  const rows = yield* Effect.tryPromise({
    try: () =>
      db
        .select({ id: autonomyRuns.id })
        .from(autonomyRuns)
        .where(
          and(
            eq(autonomyRuns.organizationId, organizationId),
            inArray(autonomyRuns.status, [...IRIS_OPEN_RUN_STATUSES])
          )
        )
        .limit(1),
    catch: (cause) =>
      new IrisRunStoreError({
        message: "Failed to check for an active run",
        cause,
      }),
  });

  return rows.length > 0;
});
