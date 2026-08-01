import { GateError } from "@notra/ai/autonomy/errors";
import {
  ACTION_BUDGET_WINDOW_HOURS,
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_HOUR,
} from "@notra/ai/constants/autonomy";
import type {
  GateEvaluation,
  GateEvaluationInput,
} from "@notra/ai/types/autonomy";
import { isWithinQuietHours } from "@notra/ai/utils/autonomy-quiet-hours";
import { db } from "@notra/db/drizzle";
import { autonomyActions, autonomyRuns } from "@notra/db/schema";
import { and, count, eq, gte, inArray, isNull, or, sum } from "drizzle-orm";
import { Effect } from "effect";

const BUDGETED_ACTION_STATUSES = [
  "succeeded",
  "executing",
  "unknown",
  "failed",
] as const;

export const evaluateGate = Effect.fn("iris.gate.evaluate")(function* (
  input: GateEvaluationInput
) {
  const {
    mandate,
    pendingSignalCount,
    actionsInLast24h,
    costCentsInLast24h,
    now,
  } = input;

  const evaluation = ((): GateEvaluation => {
    if (mandate.status !== "active") {
      return { proceed: false, reason: `Mission is ${mandate.status}` };
    }

    if (pendingSignalCount <= 0) {
      return { proceed: false, reason: "No pending signals to review" };
    }

    const quietHours = mandate.policy.quietHoursUtc;
    if (quietHours && isWithinQuietHours(now, quietHours)) {
      return {
        proceed: false,
        reason: `Quiet hours are active until ${quietHours.endHour}:00 UTC`,
      };
    }

    if (actionsInLast24h >= mandate.policy.maxActionsPerDay) {
      return {
        proceed: false,
        reason: `Daily limit of ${mandate.policy.maxActionsPerDay} actions has been reached`,
      };
    }

    if (costCentsInLast24h >= mandate.policy.maxCostCentsPerDay) {
      return {
        proceed: false,
        reason: "Daily spend limit has been reached",
      };
    }

    return { proceed: true, reason: "Ready to plan" };
  })();

  yield* Effect.annotateLogs(Effect.logDebug("iris.gate.evaluated"), {
    mandateId: mandate.id,
    proceed: evaluation.proceed,
    reason: evaluation.reason,
    pendingSignalCount,
    actionsInLast24h,
    costCentsInLast24h,
  });

  return evaluation;
});

export const countActionsInLast24h = Effect.fn("iris.gate.countActions")(
  function* (organizationId: string) {
    const since = new Date(
      Date.now() -
        ACTION_BUDGET_WINDOW_HOURS * SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND
    );

    const rows = yield* Effect.tryPromise({
      try: () =>
        db
          .select({ total: count() })
          .from(autonomyActions)
          .where(
            and(
              eq(autonomyActions.organizationId, organizationId),
              inArray(autonomyActions.status, [...BUDGETED_ACTION_STATUSES]),
              or(
                gte(autonomyActions.startedAt, since),
                and(
                  isNull(autonomyActions.startedAt),
                  gte(autonomyActions.createdAt, since)
                )
              )
            )
          ),
      catch: (cause) =>
        new GateError({
          message: "Failed to count recent autonomy actions",
          cause,
        }),
    });

    return rows.at(0)?.total ?? 0;
  }
);

export const sumRunCostCentsInLast24h = Effect.fn("iris.gate.sumCost")(
  function* (organizationId: string) {
    const since = new Date(
      Date.now() -
        ACTION_BUDGET_WINDOW_HOURS * SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND
    );

    const rows = yield* Effect.tryPromise({
      try: () =>
        db
          .select({ total: sum(autonomyRuns.costCents) })
          .from(autonomyRuns)
          .where(
            and(
              eq(autonomyRuns.organizationId, organizationId),
              or(
                gte(autonomyRuns.startedAt, since),
                gte(autonomyRuns.completedAt, since)
              )
            )
          ),
      catch: (cause) =>
        new GateError({
          message: "Failed to sum recent autonomy run cost",
          cause,
        }),
    });

    const total = Number(rows.at(0)?.total ?? 0);
    return Number.isFinite(total) ? total : 0;
  }
);
