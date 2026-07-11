import { resolvePublicHttpUrl } from "@notra/utils/url";
import { Agent } from "undici";
import type { McpDispatcherRequestInit } from "../types/mcp-fetch";

export async function fetchPublicMcpUrl(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs?: number
) {
  const url = input instanceof Request ? input.url : String(input);
  const addresses = await resolvePublicHttpUrl(url);
  let addressIndex = 0;
  const dispatcher = new Agent({
    pipelining: 0,
    connect: {
      lookup: (_hostname, _options, callback) => {
        const address = addresses[addressIndex % addresses.length];
        addressIndex += 1;
        if (!address) {
          callback(
            new Error("No validated public address is available."),
            "",
            4
          );
          return;
        }
        callback(null, address.address, address.family);
      },
    },
  });
  const signal = createMcpFetchSignal(input, init?.signal, timeoutMs);
  const requestInit: McpDispatcherRequestInit = {
    ...init,
    dispatcher,
    redirect: "error",
    signal,
  };
  try {
    const response = await fetch(input, requestInit);
    dispatcher.close().catch(() => undefined);
    return response;
  } catch (error) {
    await dispatcher.close().catch(() => undefined);
    throw error;
  }
}

function createMcpFetchSignal(
  input: RequestInfo | URL,
  initSignal: AbortSignal | null | undefined,
  timeoutMs: number | undefined
) {
  const inputSignal = input instanceof Request ? input.signal : undefined;
  const requestSignal = initSignal ?? inputSignal;
  const signals = requestSignal ? [requestSignal] : [];
  if (timeoutMs !== undefined) {
    signals.push(AbortSignal.timeout(timeoutMs));
  }
  if (signals.length === 0) {
    return undefined;
  }
  return signals.length === 1 ? signals[0] : AbortSignal.any(signals);
}
