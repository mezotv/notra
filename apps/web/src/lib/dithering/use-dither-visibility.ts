"use client";

import { useEffect, useRef, useState } from "react";
import type { DitherVisibilityState } from "@/types/dithering";

const VIEWPORT_MARGIN = "200px";
const IDLE_FALLBACK_MS = 1500;

export function useDitherVisibility(): DitherVisibilityState {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => setIsIdle(true));
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = window.setTimeout(
      () => setIsIdle(true),
      IDLE_FALLBACK_MS
    );
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setIsInView(visible);
        if (visible) {
          setHasEntered(true);
        }
      },
      { rootMargin: VIEWPORT_MARGIN }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return {
    containerRef,
    shouldRender: isIdle && hasEntered,
    isAnimating: isInView && !prefersReducedMotion,
  };
}
