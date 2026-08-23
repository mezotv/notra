"use client";

import { useEffect, useState } from "react";

export function useAnimatedSize() {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    if (!element) {
      setSize(null);
      return;
    }
    const observer = new ResizeObserver(() => {
      setSize({ width: element.offsetWidth, height: element.offsetHeight });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [element]);

  return { ref: setElement, size };
}
