import {
  allowUnmeteredAiInDevelopment,
  autumn,
} from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import type { TrackIrisRunUsageInput } from "@notra/ai/types/autonomy";
import { Effect } from "effect";

const IRIS_USAGE_SOURCE = "iris";

export const trackIrisRunUsage = Effect.fn("iris.billing.track")(function* (
  input: TrackIrisRunUsageInput
) {
  const client = autumn;
  if (!client || allowUnmeteredAiInDevelopment || input.costCents <= 0) {
    return;
  }

  const tracked = yield* Effect.result(
    Effect.tryPromise({
      try: () =>
        client.track({
          customerId: input.organizationId,
          featureId: FEATURES.AI_CREDITS,
          value: input.costCents,
          properties: {
            source: IRIS_USAGE_SOURCE,
            run_id: input.runId,
            cost_cents: input.costCents,
          },
        }),
      catch: (cause) => cause,
    })
  );

  if (tracked._tag === "Failure") {
    yield* Effect.annotateLogs(Effect.logError("iris.billing.trackFailed"), {
      organizationId: input.organizationId,
      runId: input.runId,
      costCents: input.costCents,
    });
    return;
  }

  yield* Effect.annotateLogs(Effect.logInfo("iris.billing.tracked"), {
    organizationId: input.organizationId,
    runId: input.runId,
    costCents: input.costCents,
  });
});
