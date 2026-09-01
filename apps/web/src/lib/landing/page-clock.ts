import { useSyncExternalStore } from "react";

const PAGE_LOADED_AT = Date.now();

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): number {
  return PAGE_LOADED_AT;
}

function getServerSnapshot(): null {
  return null;
}

export function usePageClockBase(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function pageClockElapsedMs(): number {
  return Date.now() - PAGE_LOADED_AT;
}
