"use client";

import { SIDEBAR_COOKIE_MAX_AGE } from "@notra/ui/lib/sidebar-state";
import { useCallback, useState } from "react";

import { SIDEBAR_WIDTH_COOKIE_NAME } from "@/constants/nav";
import type { UseSidebarWidthResult } from "@/types/components/sidebar-resize-handle";

export function useSidebarWidth(initialWidth: number): UseSidebarWidthResult {
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth);
  const [sidebarResizing, setSidebarResizing] = useState(false);

  const startSidebarResize = useCallback(() => {
    setSidebarResizing(true);
  }, []);

  const finishSidebarResize = useCallback((width: number) => {
    setSidebarWidth(width);
    document.cookie = `${SIDEBAR_WIDTH_COOKIE_NAME}=${width}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    setSidebarResizing(false);
  }, []);

  return {
    finishSidebarResize,
    setSidebarWidth,
    sidebarResizing,
    sidebarWidth,
    startSidebarResize,
  };
}
