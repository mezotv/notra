"use client";

import { useEffect, useRef, useState } from "react";
import { TOOL_TIMER_STORAGE_PREFIX } from "@/constants/chat-tool-timer";

const ELAPSED_TICK_MS = 1000;
const UNMOUNT_CLEANUP_DELAY_MS = 1000;
const pendingStorageCleanup = new Map<string, number>();

function cancelPendingStorageCleanup(storageKey: string) {
  const cleanupTimer = pendingStorageCleanup.get(storageKey);
  if (cleanupTimer === undefined) {
    return;
  }

  window.clearTimeout(cleanupTimer);
  pendingStorageCleanup.delete(storageKey);
}

function scheduleStorageCleanup(storageKey: string) {
  cancelPendingStorageCleanup(storageKey);
  const cleanupTimer = window.setTimeout(() => {
    window.localStorage.removeItem(storageKey);
    pendingStorageCleanup.delete(storageKey);
  }, UNMOUNT_CLEANUP_DELAY_MS);
  pendingStorageCleanup.set(storageKey, cleanupTimer);
}

export function useElapsedSeconds(
  isRunning: boolean,
  toolCallId: string
): number {
  const startedAtRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const storageKey = `${TOOL_TIMER_STORAGE_PREFIX}${toolCallId}`;
    cancelPendingStorageCleanup(storageKey);

    if (!isRunning) {
      startedAtRef.current = null;
      setElapsedSeconds(0);
      window.localStorage.removeItem(storageKey);
      return;
    }

    const now = Date.now();
    const storedStartedAt = Number(window.localStorage.getItem(storageKey));
    const validStoredStartedAt =
      Number.isFinite(storedStartedAt) && storedStartedAt > 0
        ? Math.min(storedStartedAt, now)
        : null;
    startedAtRef.current = validStoredStartedAt ?? startedAtRef.current ?? now;
    window.localStorage.setItem(storageKey, String(startedAtRef.current));

    const updateElapsedSeconds = () => {
      const startedAt = startedAtRef.current;
      if (startedAt !== null) {
        setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }
    };

    updateElapsedSeconds();
    const interval = window.setInterval(updateElapsedSeconds, ELAPSED_TICK_MS);

    return () => {
      window.clearInterval(interval);
      scheduleStorageCleanup(storageKey);
    };
  }, [isRunning, toolCallId]);

  return elapsedSeconds;
}
