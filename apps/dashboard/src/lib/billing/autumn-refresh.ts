import type { AutumnRefreshListener } from "@/types/billing/autumn-refresh";

const listeners = new Set<AutumnRefreshListener>();

export function subscribeToAutumnRefresh(listener: AutumnRefreshListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitAutumnRefresh() {
  for (const listener of listeners) {
    listener();
  }
}
