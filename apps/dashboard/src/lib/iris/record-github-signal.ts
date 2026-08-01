import { recordSignal } from "@notra/ai/autonomy/signals";
import { SIGNAL_SOURCE_GITHUB } from "@notra/ai/constants/autonomy-signals";
import { Effect } from "effect";
import { IrisSignalRecordingError } from "@/lib/iris/errors";
import { loadActiveMandateRow } from "@/lib/iris/mandate";
import { startIrisRun } from "@/lib/workflows/start";
import type { IrisGithubSignalInput } from "@/types/iris";
import { describeIrisError } from "@/utils/iris-error";
import {
  resolveIrisGithubOccurredAt,
  resolveIrisGithubSignalHash,
  resolveIrisGithubSignalKind,
} from "@/utils/iris-github-signal";

const recordIrisGithubSignal = Effect.fn("iris.signals.github")(function* (
  input: IrisGithubSignalInput
) {
  const kind = resolveIrisGithubSignalKind(input.eventType, input.eventAction);
  if (kind === null) {
    return;
  }

  const dedupeHash = resolveIrisGithubSignalHash({
    kind,
    repositoryId: input.repositoryId,
    eventData: input.eventData,
  });
  if (dedupeHash === null) {
    return;
  }

  const mandate = yield* loadActiveMandateRow(input.organizationId);
  if (mandate === null) {
    return;
  }

  const recorded = yield* recordSignal({
    organizationId: input.organizationId,
    source: SIGNAL_SOURCE_GITHUB,
    kind,
    sourceEventId: input.deliveryId,
    occurredAt: resolveIrisGithubOccurredAt(input.eventData),
    payload: {
      type: input.eventType,
      action: input.eventAction,
      data: input.eventData,
      repositoryId: input.repositoryId,
      repositoryName: input.repositoryName,
      discoveredBy: "webhook",
    },
    dedupeHash,
  });

  yield* Effect.tryPromise({
    try: () =>
      startIrisRun({
        organizationId: input.organizationId,
        trigger: "signal",
        executionId: `iris-signal-${recorded.signalId}`,
      }),
    catch: (cause) =>
      new IrisSignalRecordingError({
        message: "Failed to start the Iris controller",
        cause,
      }),
  });

  yield* Effect.annotateLogs(Effect.logInfo("iris.signal.dispatched"), {
    organizationId: input.organizationId,
    signalId: recorded.signalId,
    kind,
    deduplicated: recorded.deduplicated,
  });
});

export function dispatchIrisGithubSignal(
  input: IrisGithubSignalInput
): Promise<boolean> {
  return Effect.runPromise(
    recordIrisGithubSignal(input).pipe(
      Effect.as(true),
      Effect.catch((error) =>
        Effect.annotateLogs(Effect.logError("iris.signal.failed"), {
          organizationId: input.organizationId,
          eventType: input.eventType,
          error: describeIrisError(error),
        }).pipe(Effect.as(false))
      )
    )
  );
}
