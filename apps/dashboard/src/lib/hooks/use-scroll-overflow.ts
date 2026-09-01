"use client";

import { useEffect, useRef, useState } from "react";

import type {
  ScrollOverflow,
  ScrollOverflowState,
} from "@/types/scroll-overflow";

const EDGE_TOLERANCE_PX = 1;
const DEFAULT_ROOT_FONT_PX = 16;
const INITIAL_STATE: ScrollOverflowState = { hiddenBelow: 0, atEnd: true };

function remToPx(rem: number): number {
  const rootSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );
  return rem * (Number.isFinite(rootSize) ? rootSize : DEFAULT_ROOT_FONT_PX);
}

function measureOverflow(
  node: HTMLElement,
  insetRem: number
): ScrollOverflowState {
  const atEnd =
    node.scrollTop + node.clientHeight + EDGE_TOLERANCE_PX >= node.scrollHeight;
  const visibleBottom = node.scrollTop + node.clientHeight - remToPx(insetRem);
  let hiddenBelow = 0;
  for (const child of node.children) {
    if (!(child instanceof HTMLElement)) {
      continue;
    }
    if (
      child.offsetTop + child.offsetHeight >
      visibleBottom + EDGE_TOLERANCE_PX
    ) {
      hiddenBelow += 1;
    }
  }
  return { hiddenBelow, atEnd };
}

export function useScrollOverflow<T extends HTMLElement>(
  itemCount: number,
  insetRem = 0
): ScrollOverflow<T> {
  const ref = useRef<T>(null);
  const [state, setState] = useState<ScrollOverflowState>(INITIAL_STATE);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const measure = () => {
      setState(measureOverflow(node, insetRem));
    };
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [insetRem, itemCount]);

  const scrollToEnd = (smooth: boolean) => {
    const node = ref.current;
    if (!node) {
      return;
    }
    node.scrollTo({
      top: node.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  return { ref, ...state, scrollToEnd };
}
