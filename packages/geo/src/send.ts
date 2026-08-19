import { DEFAULT_ENDPOINT, INGEST_PATH, INGEST_TIMEOUT_MS } from "./constants";
import type { GeoRequestPayload, GeoTrackerOptions } from "./types";

const TRAILING_SLASHES = /\/+$/;

function ingestUrl(endpoint: string | undefined): string {
  const base = (endpoint ?? DEFAULT_ENDPOINT).replace(TRAILING_SLASHES, "");
  return `${base}${INGEST_PATH}`;
}

export async function sendRequestLog(
  payload: GeoRequestPayload,
  options: GeoTrackerOptions
): Promise<void> {
  const send = options.fetch ?? globalThis.fetch;

  try {
    await send(ingestUrl(options.endpoint), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${options.token}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
      signal: AbortSignal.timeout(INGEST_TIMEOUT_MS),
    });
  } catch (error) {
    options.onError?.(error);
  }
}
