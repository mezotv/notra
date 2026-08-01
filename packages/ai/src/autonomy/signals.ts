import { SignalIngestError } from "@notra/ai/autonomy/errors";
import type {
  AutonomySignalRow,
  CoalesceSignalsInput,
  CoalesceSignalsResult,
  RecordSignalInput,
  RecordSignalResult,
  SignalSummary,
} from "@notra/ai/types/autonomy";
import { db } from "@notra/db/drizzle";
import { autonomySignals } from "@notra/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Effect } from "effect";

const toSummary = (row: AutonomySignalRow): SignalSummary => ({
  signalId: row.id,
  source: row.source,
  kind: row.kind,
  sourceEventId: row.sourceEventId,
  occurredAt: row.occurredAt,
  payload: row.payload,
});

export const recordSignal = Effect.fn("iris.signals.record")(function* (
  input: RecordSignalInput
) {
  const now = new Date();
  const signalId = crypto.randomUUID();

  const inserted = yield* Effect.tryPromise({
    try: () =>
      db
        .insert(autonomySignals)
        .values({
          id: signalId,
          organizationId: input.organizationId,
          source: input.source,
          sourceEventId: input.sourceEventId ?? null,
          kind: input.kind,
          payload: input.payload,
          dedupeHash: input.dedupeHash,
          status: "pending",
          occurredAt: input.occurredAt,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({
          target: [autonomySignals.organizationId, autonomySignals.dedupeHash],
        })
        .returning({ id: autonomySignals.id }),
    catch: (cause) =>
      new SignalIngestError({ message: "Failed to record signal", cause }),
  });

  const insertedId = inserted.at(0)?.id;
  if (insertedId !== undefined) {
    yield* Effect.annotateLogs(Effect.logDebug("iris.signal.recorded"), {
      organizationId: input.organizationId,
      signalId: insertedId,
      kind: input.kind,
    });
    return {
      signalId: insertedId,
      deduplicated: false,
    } satisfies RecordSignalResult;
  }

  const existing = yield* Effect.tryPromise({
    try: () =>
      db
        .select({ id: autonomySignals.id })
        .from(autonomySignals)
        .where(
          and(
            eq(autonomySignals.organizationId, input.organizationId),
            eq(autonomySignals.dedupeHash, input.dedupeHash)
          )
        )
        .limit(1),
    catch: (cause) =>
      new SignalIngestError({
        message: "Failed to load deduplicated signal",
        cause,
      }),
  });

  const existingId = existing.at(0)?.id;
  if (existingId === undefined) {
    return yield* Effect.fail(
      new SignalIngestError({
        message: "Signal insert conflicted but no existing row was found",
        cause: null,
      })
    );
  }

  yield* Effect.annotateLogs(Effect.logDebug("iris.signal.deduplicated"), {
    organizationId: input.organizationId,
    signalId: existingId,
    kind: input.kind,
  });

  return {
    signalId: existingId,
    deduplicated: true,
  } satisfies RecordSignalResult;
});

export const listPendingSignals = Effect.fn("iris.signals.listPending")(
  function* (organizationId: string, limit: number) {
    return yield* Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(autonomySignals)
          .where(
            and(
              eq(autonomySignals.organizationId, organizationId),
              eq(autonomySignals.status, "pending")
            )
          )
          .orderBy(asc(autonomySignals.occurredAt))
          .limit(limit),
      catch: (cause) =>
        new SignalIngestError({
          message: "Failed to list pending signals",
          cause,
        }),
    });
  }
);

export const coalesceSignals = Effect.fn("iris.signals.coalesce")(function* (
  input: CoalesceSignalsInput
) {
  if (input.signalIds.length === 0) {
    return yield* Effect.fail(
      new SignalIngestError({
        message: "Cannot coalesce an empty signal set",
        cause: null,
      })
    );
  }

  const rows = yield* Effect.tryPromise({
    try: () =>
      db
        .select()
        .from(autonomySignals)
        .where(
          and(
            eq(autonomySignals.organizationId, input.organizationId),
            inArray(autonomySignals.id, [...input.signalIds])
          )
        )
        .orderBy(asc(autonomySignals.occurredAt)),
    catch: (cause) =>
      new SignalIngestError({
        message: "Failed to load signals for coalescing",
        cause,
      }),
  });

  const primary = rows.at(-1);
  if (primary === undefined) {
    return yield* Effect.fail(
      new SignalIngestError({
        message: "No signals found for the requested ids",
        cause: null,
      })
    );
  }

  const coalescedSignalIds: string[] = [];
  for (const row of rows) {
    if (row.id !== primary.id) {
      coalescedSignalIds.push(row.id);
    }
  }

  if (coalescedSignalIds.length > 0) {
    const now = new Date();
    yield* Effect.tryPromise({
      try: () =>
        db
          .update(autonomySignals)
          .set({
            status: "coalesced",
            coalescedIntoSignalId: primary.id,
            updatedAt: now,
          })
          .where(
            and(
              eq(autonomySignals.organizationId, input.organizationId),
              inArray(autonomySignals.id, coalescedSignalIds)
            )
          ),
      catch: (cause) =>
        new SignalIngestError({ message: "Failed to coalesce signals", cause }),
    });
  }

  yield* Effect.annotateLogs(Effect.logInfo("iris.signals.coalesced"), {
    organizationId: input.organizationId,
    primarySignalId: primary.id,
    coalescedCount: coalescedSignalIds.length,
  });

  return {
    primarySignalId: primary.id,
    primarySignal: primary,
    coalescedSignalIds,
    summaries: rows.map(toSummary),
  } satisfies CoalesceSignalsResult;
});

export const restoreSignalsToPending = Effect.fn("iris.signals.restorePending")(
  function* (organizationId: string, signalIds: readonly string[]) {
    if (signalIds.length === 0) {
      return;
    }

    const now = new Date();
    const rows = yield* Effect.tryPromise({
      try: () =>
        db
          .update(autonomySignals)
          .set({
            status: "pending",
            coalescedIntoSignalId: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(autonomySignals.organizationId, organizationId),
              eq(autonomySignals.status, "coalesced"),
              inArray(autonomySignals.id, [...signalIds])
            )
          )
          .returning({ id: autonomySignals.id }),
      catch: (cause) =>
        new SignalIngestError({
          message: "Failed to restore signals to pending",
          cause,
        }),
    });

    yield* Effect.annotateLogs(Effect.logWarning("iris.signals.restored"), {
      organizationId,
      signalCount: rows.length,
    });
  }
);

export const markSignalsProcessed = Effect.fn("iris.signals.markProcessed")(
  function* (organizationId: string, signalIds: readonly string[]) {
    if (signalIds.length === 0) {
      return;
    }

    const now = new Date();
    yield* Effect.tryPromise({
      try: () =>
        db
          .update(autonomySignals)
          .set({ status: "processed", processedAt: now, updatedAt: now })
          .where(
            and(
              eq(autonomySignals.organizationId, organizationId),
              inArray(autonomySignals.id, [...signalIds])
            )
          ),
      catch: (cause) =>
        new SignalIngestError({
          message: "Failed to mark signals processed",
          cause,
        }),
    });

    yield* Effect.annotateLogs(Effect.logDebug("iris.signals.processed"), {
      organizationId,
      signalCount: signalIds.length,
    });
  }
);
