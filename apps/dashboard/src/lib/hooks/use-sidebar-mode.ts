"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { localStorageKeys } from "@/constants/storage";
import type { SidebarMode, UseSidebarModeResult } from "@/types/components/nav";
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
    return;
  }
  window.dispatchEvent(new Event(SIDEBAR_MODE_EVENT));
}

export function useSidebarMode(
  section: string | undefined
): UseSidebarModeResult {
  const storedMode = useSyncExternalStore(
    subscribe,
    readStoredMode,
    getServerSnapshot
  );
  const mode = resolveSidebarMode(section, storedMode);

  useEffect(() => {
    if (storedMode !== mode) {
      persistMode(mode);
    }
  }, [mode, storedMode]);

  const setMode = useCallback((next: SidebarMode) => {
    persistMode(next);
  }, []);

  return { mode, setMode };
}
