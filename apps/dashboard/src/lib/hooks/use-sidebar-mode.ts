"use client";

import { useEffect, useSyncExternalStore } from "react";

import { localStorageKeys } from "@/constants/storage";
import type {
  PendingSidebarMode,
  SidebarMode,
  UseSidebarModeResult,
} from "@/types/components/nav";
import { setSidebarModeCookie } from "@/utils/cookies";
import { isSidebarMode, resolveSidebarMode } from "@/utils/nav";

const SIDEBAR_MODE_EVENT = "notra:sidebar-mode-change";

// Module-level so a pick made outside the sidebar (e.g. dismissing the GEO
// paywall) reaches the nav's mode resolution before the route changes.
let pendingMode: PendingSidebarMode | null = null;

function readStoredMode(): SidebarMode | null {
  try {
    const value = window.localStorage.getItem(localStorageKeys.sidebarMode);
    return isSidebarMode(value) ? value : null;
  } catch {
    return null;
  }
}

function readPendingMode(): PendingSidebarMode | null {
  return pendingMode;
}

function getServerSnapshot(): null {
  return null;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(SIDEBAR_MODE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SIDEBAR_MODE_EVENT, onChange);
  };
}

function notifyModeChange(): void {
  window.dispatchEvent(new Event(SIDEBAR_MODE_EVENT));
}

function persistMode(mode: SidebarMode): void {
  try {
    window.localStorage.setItem(localStorageKeys.sidebarMode, mode);
  } catch {
    // Private browsing can block localStorage; the cookie still restores
    // the next dashboard open.
  }
  setSidebarModeCookie(mode).catch(() => {
    // Cookie write is best-effort, same as localStorage.
  });
  notifyModeChange();
}

function clearPendingMode(expected: PendingSidebarMode): void {
  if (pendingMode !== expected) {
    return;
  }
  pendingMode = null;
  notifyModeChange();
}

/**
 * Pick a sidebar mode from the route it is picked in. Persists the mode
 * synchronously so a navigation issued right after already carries the updated
 * cookie, and keeps the pick pinned until the route changes so the route-derived
 * mode cannot write the old mode back in between.
 */
export function pickSidebarMode(
  mode: SidebarMode,
  route: string | undefined
): void {
  pendingMode = { mode, route };
  persistMode(mode);
}

export function useSidebarMode(
  route: string | undefined
): UseSidebarModeResult {
  const storedMode = useSyncExternalStore(
    subscribe,
    readStoredMode,
    getServerSnapshot
  );
  const pending = useSyncExternalStore(
    subscribe,
    readPendingMode,
    getServerSnapshot
  );
  const routeMode = resolveSidebarMode(route, storedMode);

  // Picking a mode navigates, so `route` — which outranks the stored mode —
  // only catches up once the new route commits. Deriving the mode from the route
  // alone leaves the switch frozen for the whole navigation and then snaps
  // everything at once. The pending pick wins until the route agrees with it.
  const mode =
    pending !== null && pending.route === route ? pending.mode : routeMode;

  // Read the store again during unmount instead of closing over `pending`: a pick
  // can be followed by navigation before React commits the snapshot update.
  useEffect(
    () => () => {
      const pendingAtUnmount = readPendingMode();
      if (pendingAtUnmount !== null) {
        clearPendingMode(pendingAtUnmount);
      }
    },
    []
  );

  // Drop a pick once the route has moved past it, so returning to where it was
  // made does not resurrect it. Comparing by identity prevents this effect from
  // clearing a newer pick made before it runs.
  useEffect(() => {
    if (pending !== null && pending.route !== route) {
      clearPendingMode(pending);
    }
  }, [pending, route]);

  useEffect(() => {
    // The org root is an entry URL, not a mode signal. Persisting studio
    // here would erase a GEO pick before the restore can send you back.
    if (route === undefined) {
      return;
    }
    if (storedMode !== mode) {
      persistMode(mode);
    }
  }, [mode, route, storedMode]);

  const setMode = (next: SidebarMode) => {
    pickSidebarMode(next, route);
  };

  return { mode, setMode, pendingMode: mode === routeMode ? null : mode };
}

export function useStoredSidebarMode(): SidebarMode | null {
  return useSyncExternalStore(subscribe, readStoredMode, getServerSnapshot);
}
