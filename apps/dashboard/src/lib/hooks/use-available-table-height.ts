"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function useAvailableTableHeight(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(fallback);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const update = () => {
      const next = Math.floor(element.clientHeight);
      if (next > 0) {
        setHeight((current) => (current === next ? current : next));
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, height] as const;
}
