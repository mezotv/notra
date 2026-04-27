import { Agent, setGlobalDispatcher } from "undici";

const TEN_MINUTES_MS = 600_000;

let configured = false;

export function configureLongFetchTimeouts() {
  if (configured) {
    return;
  }
  setGlobalDispatcher(
    new Agent({
      headersTimeout: TEN_MINUTES_MS,
      bodyTimeout: TEN_MINUTES_MS,
      keepAliveTimeout: 60_000,
    })
  );
  configured = true;
}
