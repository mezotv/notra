"use client";

import { m, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

import { IP_CHECKER_MOTION } from "@/constants/ip-checker";
import type { AnimatedHeightProps } from "@/types/ip-checker";

export function AnimatedHeight({ children, className }: AnimatedHeightProps) {
  const reduceMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.contentRect.height ?? 0;
      if (next > 0) {
        setHeight(next);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <m.div
      animate={{ height }}
      className={className}
      initial={false}
      style={{ overflow: "hidden" }}
      transition={reduceMotion ? { duration: 0 } : IP_CHECKER_MOTION.height}
    >
      <div ref={contentRef}>{children}</div>
    </m.div>
  );
}
