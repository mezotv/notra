import {
  allowUnmeteredAiInDevelopment,
  autumn,
} from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import {
  MARKUP_PERCENT,
  shouldApplyMarkup,
} from "@notra/ai/billing/token-pricing";
import type { TrackIrisRunUsageInput } from "@notra/ai/types/autonomy";
import { Effect } from "effect";

const IRIS_USAGE_SOURCE = "iris";
const MARKUP_MULTIPLIER = 1 + MARKUP_PERCENT / 100;

const resolveIrisBilledCents = Effect.fn("iris.billing.resolveMarkup")(
  function* (organizationId: string, costCents: number) {
    if (!autumn) {
      return costCents;
    }
    const client = autumn;
    const balance = yield* Effect.tryPromise({
      try: async () => {
        const data = await client.check({
          customerId: organizationId,
          featureId: FEATURES.AI_CREDITS,
        });
        return data.balance ?? null;
      },
      catch: (cause) => cause,
    }).pipe(Effect.catch(() => Effect.succeed(null)));

    return shouldApplyMarkup(balance)
      ? Math.ceil(costCents * MARKUP_MULTIPLIER)
      : costCents;
  }
);

export const trackIrisRunUsage = Effect.fn("iris.billing.track")(function* (
  input: TrackIrisRunUsageInput
) {
  const client = autumn;
  if (!client || allowUnmeteredAiInDevelopment || input.costCents <= 0) {
    return;
  }

  const billedCents = yield* resolveIrisBilledCents(
    input.organizationId,
    input.costCents
  );

  const tracked = yield* Effect.result(
    Effect.tryPromise({
      try: () =>
        client.track({
          customerId: input.organizationId,
          featureId: FEATURES.AI_CREDITS,
          value: billedCents,
          properties: {
            source: IRIS_USAGE_SOURCE,
            run_id: input.runId,
            cost_cents: billedCents,
            raw_cost_cents: input.costCents,
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
