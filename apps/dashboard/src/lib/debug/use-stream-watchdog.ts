"use client";

import { useEffect, useRef, useState } from "react";
import { STREAM_STALE_AFTER_MS } from "@/constants/debug";

export function useStreamWatchdog(
  eventCount: number,
  isBusy: boolean
): boolean {
  const lastEventAtRef = useRef(0);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (eventCount >= 0) {
      lastEventAtRef.current = Date.now();
      setIsStale(false);
    }
  }, [eventCount]);

  useEffect(() => {
    if (!isBusy) {
      setIsStale(false);
      return;
    }

    lastEventAtRef.current = Date.now();
    setIsStale(false);

    const interval = setInterval(() => {
      setIsStale(Date.now() - lastEventAtRef.current > STREAM_STALE_AFTER_MS);
    }, 5000);
    return () => clearInterval(interval);
  }, [isBusy]);

  return isStale;
}
