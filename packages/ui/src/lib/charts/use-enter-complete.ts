"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Returns true once a mount-progress MotionValue reaches 1.
 * Use to swap animated MotionValue-driven props for static values after
 * enter completes — drops per-frame subscriptions during pan/hover.
 */
export function useEnterComplete(mountProgress: MotionValue<number>): boolean {
  const [complete, setComplete] = useState(() => mountProgress.get() >= 1);

  useEffect(() => {
    const unsubscribe = mountProgress.on("change", (value) => {
      if (value >= 1) {
        setComplete(true);
      }
    });
    // Catch a MotionValue that already finished before we subscribed.
    if (mountProgress.get() >= 1) {
      setComplete(true);
    }
    return () => {
      unsubscribe();
    };
  }, [mountProgress]);

  return complete;
}
