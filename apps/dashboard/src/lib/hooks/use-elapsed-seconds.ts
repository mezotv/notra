"use client";

import { useEffect, useRef, useState } from "react";

const ELAPSED_TICK_MS = 1000;

export function useElapsedSeconds(
  isRunning: boolean,
  persistedStartedAt?: number
): number {
  const startedAtRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      startedAtRef.current = null;
      setElapsedSeconds(0);
      return;
    }

    const now = Date.now();
    const validPersistedStartedAt =
      typeof persistedStartedAt === "number" &&
      Number.isFinite(persistedStartedAt) &&
      persistedStartedAt > 0
        ? Math.min(persistedStartedAt, now)
        : null;
    startedAtRef.current =
      validPersistedStartedAt ?? startedAtRef.current ?? now;

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
    };
  }, [isRunning, persistedStartedAt]);

  return elapsedSeconds;
}
