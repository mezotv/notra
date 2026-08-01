import { recordSignal } from "@notra/ai/autonomy/signals";
import {
  IRIS_POLL_LOOKBACK_HOURS,
  IRIS_POLL_SOURCE_CONCURRENCY,
  MILLISECONDS_PER_HOUR,
} from "@notra/ai/constants/autonomy-poll";
import type {
  IrisPollSourceSummary,
  IrisSourcePollResult,
  PollIrisSourcesInput,
  PollIrisSourcesResult,
} from "@notra/ai/types/autonomy-poll";
import { buildIrisPollDigest } from "@notra/ai/utils/iris-poll-digest";
import { pollGithubSource } from "@notra/ai/utils/iris-poll-github";
import { pollGranolaSource } from "@notra/ai/utils/iris-poll-granola";
import { pollLinearSource } from "@notra/ai/utils/iris-poll-linear";
import { Effect } from "effect";

const recordSourceItems = Effect.fn("iris.poll.record")(function* (
  organizationId: string,
  source: IrisSourcePollResult,
  digest: string
) {
  let recordedCount = 0;
  let deduplicatedCount = 0;

  for (const item of source.items) {
    const result = yield* recordSignal({
      organizationId,
      source: item.source,
      kind: item.kind,
      sourceEventId: item.sourceEventId,
      occurredAt: item.occurredAt,
      payload: { ...item.payload, digest },
      dedupeHash: item.dedupeHash,
    });

    if (result.deduplicated) {
      deduplicatedCount += 1;
    } else {
      recordedCount += 1;
    }
  }

  return {
    source: source.source,
    itemCount: source.items.length,
    recordedCount,
    deduplicatedCount,
    skippedReason: source.skippedReason,
  } satisfies IrisPollSourceSummary;
});

export const pollIrisSources = Effect.fn("iris.poll.sources")(function* (
  input: PollIrisSourcesInput
) {
  const lookbackHours = input.lookbackHours ?? IRIS_POLL_LOOKBACK_HOURS;
  const generatedAt = new Date();
  const since = new Date(
    generatedAt.getTime() - lookbackHours * MILLISECONDS_PER_HOUR
  );
  const window = { organizationId: input.organizationId, since };

  const sources = yield* Effect.all(
    [
      pollGithubSource(window),
      pollLinearSource(window),
      pollGranolaSource(window),
    ],
    { concurrency: IRIS_POLL_SOURCE_CONCURRENCY }
  );

  const digest = buildIrisPollDigest({ lookbackHours, generatedAt, sources });

  const summaries = yield* Effect.forEach(sources, (source) =>
    recordSourceItems(input.organizationId, source, digest)
  );

  const recordedCount = summaries.reduce(
    (total, summary) => total + summary.recordedCount,
    0
  );
  const deduplicatedCount = summaries.reduce(
    (total, summary) => total + summary.deduplicatedCount,
    0
  );

  yield* Effect.annotateLogs(Effect.logInfo("iris.poll.completed"), {
    organizationId: input.organizationId,
    lookbackHours,
    recordedCount,
    deduplicatedCount,
  });

  return {
    recordedCount,
    deduplicatedCount,
    digest,
    sources: summaries,
  } satisfies PollIrisSourcesResult;
});
