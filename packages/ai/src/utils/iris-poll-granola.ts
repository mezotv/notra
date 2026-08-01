import { IrisPollError } from "@notra/ai/autonomy/errors";
import { SIGNAL_SOURCE_GRANOLA } from "@notra/ai/constants/autonomy-signals";
import { getGranolaIntegrationsByOrganization } from "@notra/ai/integrations/granola";
import type {
  IrisPollWindow,
  IrisSourcePollResult,
} from "@notra/ai/types/autonomy-poll";
import { Effect } from "effect";

const NO_INTEGRATIONS_REASON = "No enabled Granola workspaces are connected";
const NO_FETCH_HELPER_REASON =
  "Granola note fetching is not available to the autonomy package yet";

export const pollGranolaSource = Effect.fn("iris.poll.granola")(function* (
  window: IrisPollWindow
) {
  const integrations = yield* Effect.tryPromise({
    try: () => getGranolaIntegrationsByOrganization(window.organizationId),
    catch: (cause) =>
      new IrisPollError({
        message: "Failed to load Granola integrations to poll",
        source: SIGNAL_SOURCE_GRANOLA,
        cause,
      }),
  });

  const enabled = integrations.filter((integration) => integration.enabled);

  if (enabled.length === 0) {
    return {
      source: SIGNAL_SOURCE_GRANOLA,
      items: [],
      skippedReason: NO_INTEGRATIONS_REASON,
    } satisfies IrisSourcePollResult;
  }

  yield* Effect.annotateLogs(Effect.logDebug("iris.poll.granola.skipped"), {
    organizationId: window.organizationId,
    integrationCount: enabled.length,
  });

  return {
    source: SIGNAL_SOURCE_GRANOLA,
    items: [],
    skippedReason: NO_FETCH_HELPER_REASON,
  } satisfies IrisSourcePollResult;
});
