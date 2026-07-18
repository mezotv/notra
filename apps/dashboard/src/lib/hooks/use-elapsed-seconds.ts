"use client";

import { useEffect, useRef, useState } from "react";
import { TOOL_TIMER_STORAGE_PREFIX } from "@/constants/chat-tool-timer";

const ELAPSED_TICK_MS = 1000;
const MAX_PERSISTED_TIMER_AGE_MS = 30 * 60 * 1000;

export function useElapsedSeconds(
  isRunning: boolean,
  toolCallId: string
): number {
  const startedAtRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const storageKey = `${TOOL_TIMER_STORAGE_PREFIX}${toolCallId}`;

    if (!isRunning) {
      startedAtRef.current = null;
      setElapsedSeconds(0);
      window.localStorage.removeItem(storageKey);
      return;
    }

    const now = Date.now();
    const storedStartedAt = Number(window.localStorage.getItem(storageKey));
    const clampedStoredStartedAt = Math.min(storedStartedAt, now);
    const validStoredStartedAt =
      Number.isFinite(storedStartedAt) &&
      storedStartedAt > 0 &&
      now - clampedStoredStartedAt <= MAX_PERSISTED_TIMER_AGE_MS
        ? clampedStoredStartedAt
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
      startedAtRef.current = null;
    };
  }, [isRunning, toolCallId]);

  return elapsedSeconds;
}
