import { acquireClaim, releaseClaim } from "@notra/ai/autonomy/claims";
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
const IRIS_BILLING_CLAIM_SCOPE = "iris-billing";
const IRIS_BILLING_CLAIM_TTL_SECONDS = 60 * 60 * 24 * 30;
const MARKUP_MULTIPLIER = 1 + MARKUP_PERCENT / 100;

const resolveIrisBilledCents = Effect.fn("iris.billing.resolveMarkup")(
  function* (organizationId: string, costCents: number) {
    if (!autumn) {
      return costCents;
    }
    const client = autumn;
    const balanceResult = yield* Effect.result(
      Effect.tryPromise({
        try: async () => {
          const data = await client.check({
            customerId: organizationId,
            featureId: FEATURES.AI_CREDITS,
          });
          return data.balance ?? null;
        },
        catch: (cause) => cause,
      })
    );

    if (balanceResult._tag === "Failure") {
      yield* Effect.annotateLogs(
        Effect.logWarning("iris.billing.markupCheckFailed"),
        { organizationId }
      );
      return Math.ceil(costCents * MARKUP_MULTIPLIER);
    }

    return shouldApplyMarkup(balanceResult.success)
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

  const claimToken = crypto.randomUUID();
  const claim = yield* Effect.tryPromise({
    try: () =>
      acquireClaim({
        scope: IRIS_BILLING_CLAIM_SCOPE,
        claimKey: input.runId,
        ownerToken: claimToken,
        ttlSeconds: IRIS_BILLING_CLAIM_TTL_SECONDS,
        organizationId: input.organizationId,
      }),
    catch: (cause) => cause,
  }).pipe(Effect.catch(() => Effect.succeed({ claimed: false })));

  if (!claim.claimed) {
    yield* Effect.annotateLogs(Effect.logInfo("iris.billing.alreadyTracked"), {
      organizationId: input.organizationId,
      runId: input.runId,
    });
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
        }, { headers: { "Idempotency-Key": `iris-run-${input.runId}` } }),
      catch: (cause) => cause,
    })
  );

  if (tracked._tag === "Failure") {
    yield* Effect.tryPromise({
      try: () =>
        releaseClaim({
          scope: IRIS_BILLING_CLAIM_SCOPE,
          claimKey: input.runId,
          ownerToken: claimToken,
        }),
      catch: (cause) => cause,
    }).pipe(Effect.catch(() => Effect.void));
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
    costCents: billedCents,
  });
});
