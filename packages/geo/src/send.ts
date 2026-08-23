import { DEFAULT_ENDPOINT, INGEST_PATH, INGEST_TIMEOUT_MS } from "./constants";
import type { GeoRequestPayload, GeoTrackerOptions } from "./types";

function ingestUrl(endpoint: string | undefined): string {
  const value = endpoint ?? DEFAULT_ENDPOINT;
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end -= 1;
  }
  const base = value.slice(0, end);
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
