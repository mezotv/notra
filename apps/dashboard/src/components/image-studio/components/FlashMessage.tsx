"use client";

import { useAtom } from "jotai";
import { useRef } from "react";
import { derivedFlashMessageAtom, flashShownAtom } from "../store/flash";

const FlashMessage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flashMessage] = useAtom(derivedFlashMessageAtom);
  const [flashShown] = useAtom(flashShownAtom);

  if (!flashShown) {
    return null;
  }

  return (
    <div
      className="fade-in absolute inset-0 z-10 flex animate-in items-center justify-center bg-background/90 duration-200"
      ref={containerRef}
    >
      <span className="flex h-9 items-center gap-2 rounded-full bg-card px-4 py-2.5 text-foreground text-sm backdrop-blur-xl">
        {flashMessage?.icon}
        {flashMessage?.message}
      </span>
    </div>
  );
};

export default FlashMessage;
