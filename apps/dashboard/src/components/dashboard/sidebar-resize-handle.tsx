"use client";

import { useSidebar } from "@notra/ui/components/ui/sidebar";
import { type KeyboardEvent, type PointerEvent, useRef } from "react";

import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_RESIZE_STEP,
} from "@/constants/nav";
import type { SidebarResizeHandleProps } from "@/types/components/sidebar-resize-handle";
import { clampSidebarWidth } from "@/utils/sidebar-width";

export function SidebarResizeHandle({
  onWidthChange,
  onWidthChangeEnd,
  onWidthChangeStart,
  width,
}: SidebarResizeHandleProps) {
  const { state } = useSidebar();
  const currentWidthRef = useRef<number | null>(null);
  const startWidthRef = useRef(0);
  const startXRef = useRef(0);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || state === "collapsed") {
      return;
    }

    event.preventDefault();
    currentWidthRef.current = width;
    startWidthRef.current = width;
    startXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    onWidthChangeStart();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (currentWidthRef.current === null) {
      return;
    }

    const nextWidth = clampSidebarWidth(
      startWidthRef.current + event.clientX - startXRef.current
    );
    currentWidthRef.current = nextWidth;
    onWidthChange(nextWidth);
  };

  const finishResize = (event: PointerEvent<HTMLDivElement>) => {
    const currentWidth = currentWidthRef.current;
    if (currentWidth === null) {
      return;
    }

    currentWidthRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onWidthChangeEnd(currentWidth);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextWidth: number | undefined;

    if (event.key === "ArrowLeft") {
      nextWidth = clampSidebarWidth(width - SIDEBAR_RESIZE_STEP);
    } else if (event.key === "ArrowRight") {
      nextWidth = clampSidebarWidth(width + SIDEBAR_RESIZE_STEP);
    } else if (event.key === "Home") {
      nextWidth = SIDEBAR_MIN_WIDTH;
    } else if (event.key === "End") {
      nextWidth = SIDEBAR_MAX_WIDTH;
    }

    if (nextWidth === undefined) {
      return;
    }

    event.preventDefault();
    onWidthChange(nextWidth);
    onWidthChangeEnd(nextWidth);
  };

  return (
    <div
      aria-label="Resize sidebar"
      aria-orientation="vertical"
      aria-valuemax={SIDEBAR_MAX_WIDTH}
      aria-valuemin={SIDEBAR_MIN_WIDTH}
      aria-valuenow={width}
      className="absolute inset-y-2 right-0 z-20 hidden w-2 cursor-col-resize touch-none outline-none group-data-[collapsible=icon]:hidden md:block"
      onDoubleClick={() => {
        onWidthChange(SIDEBAR_DEFAULT_WIDTH);
        onWidthChangeEnd(SIDEBAR_DEFAULT_WIDTH);
      }}
      onKeyDown={handleKeyDown}
      onLostPointerCapture={finishResize}
      onPointerCancel={finishResize}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishResize}
      role="separator"
      tabIndex={state === "collapsed" ? -1 : 0}
      title="Drag to resize sidebar. Double-click to reset."
    />
  );
}
