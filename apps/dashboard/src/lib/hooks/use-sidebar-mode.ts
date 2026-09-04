"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { localStorageKeys } from "@/constants/storage";
import type {
  PendingSidebarMode,
  SidebarMode,
  UseSidebarModeResult,
} from "@/types/components/nav";
import { setSidebarModeCookie } from "@/utils/cookies";
import { isSidebarMode, resolveSidebarMode } from "@/utils/nav";

const SIDEBAR_MODE_EVENT = "notra:sidebar-mode-change";

function readStoredMode(): SidebarMode | null {
  try {
    const value = window.localStorage.getItem(localStorageKeys.sidebarMode);
    return isSidebarMode(value) ? value : null;
  } catch {
    return null;
  }
}

function getServerSnapshot(): SidebarMode | null {
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
  window.dispatchEvent(new Event(SIDEBAR_MODE_EVENT));
}

export function useSidebarMode(
  route: string | undefined
): UseSidebarModeResult {
  const storedMode = useSyncExternalStore(
    subscribe,
    readStoredMode,
    getServerSnapshot
  );
  const routeMode = resolveSidebarMode(route, storedMode);

  // Picking a mode navigates, so `route` — which outranks the stored mode —
  // only catches up once the new route commits. Deriving the mode from the route
  // alone leaves the switch frozen for the whole navigation and then snaps
  // everything at once. The pending pick wins until the route agrees with it.
  const [pending, setPending] = useState<PendingSidebarMode | null>(null);
  const [lastRoute, setLastRoute] = useState(route);

  // Drop a pick the route has moved past, so returning to where it was
  // made in does not resurrect it. Done during render rather than in an effect
  // so the stale pick never reaches the screen.
  if (lastRoute !== route) {
    setLastRoute(route);
    setPending(null);
  }

  const mode =
    pending !== null && pending.route === route ? pending.mode : routeMode;

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
    setPending({ mode: next, route });
    persistMode(next);
  };

  return { mode, setMode, pendingMode: mode === routeMode ? null : mode };
}

export function useStoredSidebarMode(): SidebarMode | null {
  return useSyncExternalStore(subscribe, readStoredMode, getServerSnapshot);
}
