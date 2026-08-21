"use client";

import { useCallback, useRef, useState } from "react";

export function useAnimatedSize() {
  const observerRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  const ref = useCallback((element: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!element) {
      setSize(null);
      return;
    }
    const observer = new ResizeObserver(() => {
      setSize({ width: element.offsetWidth, height: element.offsetHeight });
    });
    observer.observe(element);
    observerRef.current = observer;
  }, []);

  return { ref, size };
}
