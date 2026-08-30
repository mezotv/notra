import type { RefObject } from "react";

export interface ScrollOverflowState {
  hiddenBelow: number;
  atEnd: boolean;
}

export interface ScrollOverflow<
  T extends HTMLElement,
> extends ScrollOverflowState {
  ref: RefObject<T | null>;
  scrollToEnd: (smooth: boolean) => void;
}
