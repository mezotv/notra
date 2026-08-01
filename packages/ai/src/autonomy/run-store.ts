import { RunPersistenceError } from "@notra/ai/autonomy/errors";
import type {
  AppendCheckpointInput,
  CompleteRunInput,
  CreateGoalWithTasksInput,
  CreateGoalWithTasksResult,
  CreateRunInput,
  FinishActionInput,
  MarkTaskInput,
  PlannedTaskRecord,
  RecordPlannerOutputInput,
  StartActionInput,
  StartActionResult,
  UpdateGoalStatusInput,
} from "@notra/ai/types/autonomy";
import { topologicallySortNodes } from "@notra/ai/utils/autonomy-topo";
import { db } from "@notra/db/drizzle";
import {
  autonomyActions,
  autonomyCheckpoints,
  autonomyGoals,
  autonomyRuns,
  autonomyTasks,
} from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

const TERMINAL_TASK_STATUSES = ["completed", "failed", "canceled"];

export const createRun = Effect.fn("iris.run.create")(function* (
  input: CreateRunInput
) {
  const now = new Date();
  const runId = crypto.randomUUID();

  const rows = yield* Effect.tryPromise({
    try: () =>
      db
        .insert(autonomyRuns)
        .values({
          id: runId,
          organizationId: input.organizationId,
          mandateId: input.mandateId,
          mandateVersion: input.mandateVersion,
          trigger: input.trigger,
          status: "planning",
          startedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
    catch: (cause) =>
      new RunPersistenceError({ message: "Failed to create run", cause }),
  });

  const run = rows.at(0);
  if (run === undefined) {
    return yield* Effect.fail(
      new RunPersistenceError({
        message: "Run insert returned no row",
        cause: null,
      })
    );
  }

  yield* Effect.annotateLogs(Effect.logInfo("iris.run.created"), {
    organizationId: input.organizationId,
    runId,
    trigger: input.trigger,
  });

  return run;
});

export const recordPlannerOutput = Effect.fn("iris.run.recordPlannerOutput")(
  function* (input: RecordPlannerOutputInput) {
    const now = new Date();

    yield* Effect.tryPromise({
      try: () =>
        db
          .update(autonomyRuns)
          .set({
            plannerOutput: input.plannerOutput,
            plannerInputHash: input.plannerInputHash,
            ...(input.costCents === undefined
              ? {}
              : { costCents: input.costCents }),
            updatedAt: now,
          })
          .where(eq(autonomyRuns.id, input.runId)),
      catch: (cause) =>
        new RunPersistenceError({
          message: "Failed to record planner output",
          cause,
        }),
    });

    yield* Effect.annotateLogs(Effect.logDebug("iris.run.plannerRecorded"), {
      runId: input.runId,
      decision: input.plannerOutput.decision,
      taskCount: input.plannerOutput.tasks.length,
    });
  }
);

export const createGoalWithTasks = Effect.fn("iris.run.createGoalWithTasks")(
  function* (input: CreateGoalWithTasksInput) {
    const sorted = topologicallySortNodes(input.tasks);
    if (sorted.cycleDetected) {
      return yield* Effect.fail(
        new RunPersistenceError({
          message: "Planner tasks contain a dependency cycle",
          cause: null,
        })
      );
    }

    const now = new Date();
    const goalId = crypto.randomUUID();
    const taskIdByLocalId = new Map<string, string>();
    for (const task of input.tasks) {
      taskIdByLocalId.set(task.localId, crypto.randomUUID());
    }

    const plannedTasks: PlannedTaskRecord[] = sorted.ordered.map((task) => ({
      taskId: taskIdByLocalId.get(task.localId) ?? crypto.randomUUID(),
      localId: task.localId,
      capabilityName: task.capabilityName,
      capabilityVersion: task.capabilityVersion,
      params: task.params,
      dependsOnTaskIds: task.dependsOn
        .map((dependency) => taskIdByLocalId.get(dependency))
        .filter((taskId) => taskId !== undefined),
    }));

    yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          await tx.insert(autonomyGoals).values({
            id: goalId,
            organizationId: input.organizationId,
            mandateId: input.mandateId,
            title: input.goal.title,
            summary: input.goal.summary ?? null,
            status: "in_progress",
            originSignalIds: [...(input.originSignalIds ?? [])],
            createdAt: now,
            updatedAt: now,
          });

          if (plannedTasks.length > 0) {
            await tx.insert(autonomyTasks).values(
              plannedTasks.map((task) => ({
                id: task.taskId,
                organizationId: input.organizationId,
                goalId,
                runId: input.runId,
                capabilityName: task.capabilityName,
                capabilityVersion: task.capabilityVersion,
                params: task.params,
                dependsOnTaskIds: task.dependsOnTaskIds,
                status: "pending" as const,
                createdAt: now,
                updatedAt: now,
              }))
            );
          }

          await tx
            .update(autonomyRuns)
            .set({ goalId, status: "executing", updatedAt: now })
            .where(eq(autonomyRuns.id, input.runId));
        }),
      catch: (cause) =>
        new RunPersistenceError({
          message: "Failed to persist goal and tasks",
          cause,
        }),
    });

    yield* Effect.annotateLogs(Effect.logInfo("iris.run.goalCreated"), {
      organizationId: input.organizationId,
      runId: input.runId,
      goalId,
      taskCount: plannedTasks.length,
    });

    return { goalId, tasks: plannedTasks } satisfies CreateGoalWithTasksResult;
  }
);

export const startAction = Effect.fn("iris.action.start")(function* (
  input: StartActionInput
) {
  const now = new Date();
  const actionId = crypto.randomUUID();

  const inserted = yield* Effect.tryPromise({
    try: () =>
      db
        .insert(autonomyActions)
        .values({
          id: actionId,
          organizationId: input.organizationId,
          runId: input.runId,
          taskId: input.taskId,
          capabilityName: input.capabilityName,
          capabilityVersion: input.capabilityVersion,
          idempotencyKey: input.idempotencyKey,
          status: "executing",
          startedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({
          target: [
            autonomyActions.organizationId,
            autonomyActions.capabilityName,
            autonomyActions.idempotencyKey,
          ],
        })
        .returning(),
    catch: (cause) =>
      new RunPersistenceError({ message: "Failed to start action", cause }),
  });

  const action = inserted.at(0);
  if (action !== undefined) {
    yield* Effect.annotateLogs(Effect.logInfo("iris.action.started"), {
      organizationId: input.organizationId,
      runId: input.runId,
      actionId,
      capabilityName: input.capabilityName,
    });
    return { action, alreadyExisted: false } satisfies StartActionResult;
  }

  const existing = yield* Effect.tryPromise({
    try: () =>
      db
        .select()
        .from(autonomyActions)
        .where(
          and(
            eq(autonomyActions.organizationId, input.organizationId),
            eq(autonomyActions.capabilityName, input.capabilityName),
            eq(autonomyActions.idempotencyKey, input.idempotencyKey)
          )
        )
        .limit(1),
    catch: (cause) =>
      new RunPersistenceError({
        message: "Failed to load existing action",
        cause,
      }),
  });

  const existingAction = existing.at(0);
  if (existingAction === undefined) {
    return yield* Effect.fail(
      new RunPersistenceError({
        message: "Action insert conflicted but no existing row was found",
        cause: null,
      })
    );
  }

  yield* Effect.annotateLogs(Effect.logWarning("iris.action.duplicate"), {
    organizationId: input.organizationId,
    runId: input.runId,
    actionId: existingAction.id,
    capabilityName: input.capabilityName,
  });

  return {
    action: existingAction,
    alreadyExisted: true,
  } satisfies StartActionResult;
});

export const finishAction = Effect.fn("iris.action.finish")(function* (
  input: FinishActionInput
) {
  const now = new Date();

  yield* Effect.tryPromise({
    try: () =>
      db
        .update(autonomyActions)
        .set({
          status: input.status,
          externalRef: input.externalRef ?? null,
          error: input.error ?? null,
          finishedAt: now,
          updatedAt: now,
        })
        .where(eq(autonomyActions.id, input.actionId)),
    catch: (cause) =>
      new RunPersistenceError({ message: "Failed to finish action", cause }),
  });

  yield* Effect.annotateLogs(Effect.logInfo("iris.action.finished"), {
    actionId: input.actionId,
    status: input.status,
  });
});

export const markTask = Effect.fn("iris.task.mark")(function* (
  input: MarkTaskInput
) {
  const now = new Date();
  const isTerminal = TERMINAL_TASK_STATUSES.includes(input.status);

  yield* Effect.tryPromise({
    try: () =>
      db
        .update(autonomyTasks)
        .set({
          status: input.status,
          ...(input.result === undefined ? {} : { result: input.result }),
          ...(input.errorMessage === undefined
            ? {}
            : { errorMessage: input.errorMessage }),
          ...(input.attempt === undefined ? {} : { attempt: input.attempt }),
          ...(isTerminal ? { completedAt: now } : {}),
          updatedAt: now,
        })
        .where(eq(autonomyTasks.id, input.taskId)),
    catch: (cause) =>
      new RunPersistenceError({ message: "Failed to update task", cause }),
  });

  yield* Effect.annotateLogs(Effect.logDebug("iris.task.marked"), {
    taskId: input.taskId,
    status: input.status,
  });
});

export const updateGoalStatus = Effect.fn("iris.goal.updateStatus")(function* (
  input: UpdateGoalStatusInput
) {
  const now = new Date();

  yield* Effect.tryPromise({
    try: () =>
      db
        .update(autonomyGoals)
        .set({
          status: input.status,
          completedAt: input.status === "completed" ? now : null,
          updatedAt: now,
        })
        .where(eq(autonomyGoals.id, input.goalId)),
    catch: (cause) =>
      new RunPersistenceError({
        message: "Failed to update goal status",
        cause,
      }),
  });
});

export const updateRunCost = Effect.fn("iris.run.updateCost")(
  function* (input: {
    runId: string;
    organizationId: string;
    costCents: number;
  }) {
    yield* Effect.tryPromise({
      try: () =>
        db
          .update(autonomyRuns)
          .set({ costCents: input.costCents, updatedAt: new Date() })
          .where(
            and(
              eq(autonomyRuns.id, input.runId),
              eq(autonomyRuns.organizationId, input.organizationId)
            )
          ),
      catch: (cause) =>
        new RunPersistenceError({
          message: "Failed to update run cost",
          cause,
        }),
    });
  }
);

export const completeRun = Effect.fn("iris.run.complete")(function* (
  input: CompleteRunInput
) {
  const now = new Date();

  yield* Effect.tryPromise({
    try: () =>
      db
        .update(autonomyRuns)
        .set({
          status: input.status,
          ...(input.costCents === undefined
            ? {}
            : { costCents: input.costCents }),
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(autonomyRuns.id, input.runId)),
    catch: (cause) =>
      new RunPersistenceError({ message: "Failed to complete run", cause }),
  });

  yield* Effect.annotateLogs(Effect.logInfo("iris.run.completed"), {
    runId: input.runId,
    status: input.status,
  });
});

export const appendCheckpoint = Effect.fn("iris.run.appendCheckpoint")(
  function* (input: AppendCheckpointInput) {
    const checkpointId = crypto.randomUUID();

    yield* Effect.tryPromise({
      try: () =>
        db.insert(autonomyCheckpoints).values({
          id: checkpointId,
          organizationId: input.organizationId,
          runId: input.runId,
          taskId: input.taskId ?? null,
          kind: input.kind,
          state: input.state,
          createdAt: new Date(),
        }),
      catch: (cause) =>
        new RunPersistenceError({
          message: "Failed to append checkpoint",
          cause,
        }),
    });

    yield* Effect.annotateLogs(Effect.logDebug("iris.run.checkpoint"), {
      organizationId: input.organizationId,
      runId: input.runId,
      kind: input.kind,
    });

    return checkpointId;
  }
);
