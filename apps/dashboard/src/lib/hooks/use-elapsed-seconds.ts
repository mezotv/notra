"use client";

import { useEffect, useRef, useState } from "react";

const ELAPSED_TICK_MS = 1000;

export function useElapsedSeconds(isRunning: boolean): number {
  const startedAtRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      startedAtRef.current = null;
      setElapsedSeconds(0);
      return;
    }

    startedAtRef.current ??= Date.now();

    const interval = window.setInterval(() => {
      const startedAt = startedAtRef.current;
      if (startedAt !== null) {
        setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }
    }, ELAPSED_TICK_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [isRunning]);

  return elapsedSeconds;
}
