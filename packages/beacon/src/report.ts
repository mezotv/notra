import type { BeaconConfig, BeaconEvent, BeaconEventContext } from "./types";

const INGEST_TIMEOUT_MS = 2000;

function schedule(
  promise: Promise<unknown>,
  context: BeaconEventContext | undefined
): void {
  const settled = promise.catch(() => undefined);
  context?.waitUntil?.(settled);
}

export function reportAiHit(
  config: BeaconConfig,
  event: BeaconEvent,
  context?: BeaconEventContext
): void {
  const send = config.fetchImpl ?? fetch;

  try {
    schedule(
      send(config.ingestUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
        keepalive: true,
        signal: AbortSignal.timeout(INGEST_TIMEOUT_MS),
      }),
      context
    );
  } catch {
    return;
  }
}
