import { TEN_MINUTES_MS } from "@notra/ai/constants/repo-image";
import { Agent, getGlobalDispatcher, setGlobalDispatcher } from "undici";

export async function withLongFetchTimeouts<T>(callback: () => Promise<T>) {
  const previousDispatcher = getGlobalDispatcher();
  const dispatcher = new Agent({
    headersTimeout: TEN_MINUTES_MS,
    bodyTimeout: TEN_MINUTES_MS,
    keepAliveTimeout: 60_000,
  });

  setGlobalDispatcher(dispatcher);

  try {
    return await callback();
  } finally {
    setGlobalDispatcher(previousDispatcher);
    await dispatcher.close();
  }
}
