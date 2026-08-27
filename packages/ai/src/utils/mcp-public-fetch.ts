import { resolvePublicHttpUrl } from "@notra/utils/url";
import { Agent, fetch as undiciFetch } from "undici/index.js";

import { mcpFetchResponseSchema } from "../schemas/mcp-fetch";
import type { McpDispatcherRequestInit } from "../types/mcp-fetch";

export async function fetchPublicMcpUrl(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs?: number
) {
  const request = new Request(input, init);
  const addresses = await resolvePublicHttpUrl(request.url);
  let addressIndex = 0;
  const dispatcher = new Agent({
    pipelining: 0,
    connect: {
      lookup: (_hostname, options, callback) => {
        if (options.all) {
          callback(null, addresses);
          return;
        }
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
  const signal = createMcpFetchSignal(request.signal, timeoutMs);
  const requestInit: McpDispatcherRequestInit = {
    body: request.body,
    cache: request.cache,
    credentials: request.credentials,
    dispatcher,
    duplex: "half",
    headers: request.headers,
    integrity: request.integrity,
    keepalive: request.keepalive,
    method: request.method,
    mode: request.mode,
    redirect: "error",
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    signal,
  };
  try {
    const response = await Reflect.apply(undiciFetch, undefined, [
      request.url,
      requestInit,
    ]);
    dispatcher.close().catch(() => undefined);
    return mcpFetchResponseSchema.parse(response);
  } catch (error) {
    await dispatcher.close().catch(() => undefined);
    throw error;
  }
}

function createMcpFetchSignal(
  requestSignal: AbortSignal,
  timeoutMs: number | undefined
) {
  return timeoutMs === undefined
    ? requestSignal
    : AbortSignal.any([requestSignal, AbortSignal.timeout(timeoutMs)]);
}
