"use client";

import {
  createContext,
  type PropsWithChildren,
  type RefObject,
  useRef,
} from "react";

export const FrameContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

const FrameContextStore = ({ children }: PropsWithChildren) => {
  const ref = useRef<HTMLDivElement>(null);

  return <FrameContext.Provider value={ref}>{children}</FrameContext.Provider>;
};

export default FrameContextStore;
