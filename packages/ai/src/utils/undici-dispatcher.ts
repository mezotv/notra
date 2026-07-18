import { LONG_FETCH_TIMEOUT_MS } from "@notra/ai/constants/repo-image";
import { Agent, getGlobalDispatcher, setGlobalDispatcher } from "undici";

export async function withLongFetchTimeouts<T>(callback: () => Promise<T>) {
  const previousDispatcher = getGlobalDispatcher();
  const dispatcher = new Agent({
    headersTimeout: LONG_FETCH_TIMEOUT_MS,
    bodyTimeout: LONG_FETCH_TIMEOUT_MS,
    keepAliveTimeout: 60_000,
  });

  setGlobalDispatcher(dispatcher);

  try {
    return await callback();
  } finally {
    setGlobalDispatcher(previousDispatcher);
    if (typeof dispatcher.close === "function") {
      await dispatcher.close().catch((error: unknown) => {
        console.warn("Failed to close long-timeout fetch dispatcher", error);
      });
    }
  }
}
